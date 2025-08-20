import { prisma } from "@linkwarden/prisma";
import { Prisma } from "@linkwarden/prisma/client";

type PickLinksOptions = {
  maxBatchLinks: number;
};

export default async function getLinkBatchFairly({
  maxBatchLinks,
}: PickLinksOptions) {
  if (maxBatchLinks <= 0) return [];

  const baseLinkWhere: Prisma.LinkWhereInput = {
    url: { not: null },
    OR: [
      { lastPreserved: null },
      {
        createdBy: {
          is: {
            aiTagExistingLinks: true,
            NOT: { aiTaggingMethod: "DISABLED" },
          },
        },
        aiTagged: false,
      },
    ],
  };

  const users = await prisma.user.findMany({
    where: {
      createdLinks: {
        some: {
          ...baseLinkWhere,
        },
      },
      ...(process.env.STRIPE_SECRET_KEY
        ? {
            OR: [
              { subscriptions: { is: { active: true } } },
              { parentSubscription: { is: { active: true } } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastPickedAt: { sort: "asc", nulls: "first" } }, { id: "asc" }],
    select: { id: true, lastPickedAt: true },
    take: maxBatchLinks,
  });

  if (users.length === 0) return [];

  const linkUserMap = new Map<number, number>();

  for (const user of users) {
    const userLinks = await prisma.link.findMany({
      where: { createdBy: { id: user.id }, ...baseLinkWhere },
      orderBy: [{ createdAt: "desc" }],
      take: maxBatchLinks,
      select: { id: true },
    });

    linkUserMap.set(user.id, userLinks.length);
  }

  const uniqueUsersWithLinks = Array.from(linkUserMap.entries())
    .filter(([, count]) => count > 0)
    .map(([userId]) => userId);

  // Pick one `linksPerUser` from the `linkUserMap` recursively until we reach the `maxBatchLinks` OR run out of links
  const linksPerUser = Math.max(1, Math.floor(maxBatchLinks / users.length));

  const nextOffset = new Map<number, number>();
  users.forEach((u) => nextOffset.set(u.id, 0));

  const picked = new Set<number>();

  while (picked.size < maxBatchLinks) {
    let addedThisRound = 0;

    for (const { id: userId } of users) {
      if (picked.size >= maxBatchLinks) break;

      const remaining = maxBatchLinks - picked.size;
      const toTake = Math.min(linksPerUser, remaining);
      if (toTake <= 0) break;

      const skip = nextOffset.get(userId) ?? 0;

      const userLinks = await prisma.link.findMany({
        where: { ...baseLinkWhere, createdBy: { id: userId } },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: toTake,
        select: { id: true },
      });

      if (userLinks.length === 0) continue; // this user ran out

      nextOffset.set(userId, skip + userLinks.length);

      for (const { id } of userLinks) {
        if (picked.size >= maxBatchLinks) break;
        if (!picked.has(id)) {
          picked.add(id);
          addedThisRound++;
        }
      }
    }

    // Nobody contributed anything — avoid infinite loop
    if (addedThisRound === 0) break;
  }

  if (picked.size === 0) return [];

  const pickedIds = Array.from(picked);

  const batch = await prisma.link.findMany({
    where: { id: { in: pickedIds } },
    include: {
      collection: { include: { owner: true } },
      tags: true,
    },
  });

  const now = new Date();
  await prisma.user.updateMany({
    where: { id: { in: uniqueUsersWithLinks } },
    data: { lastPickedAt: now },
  });

  const order = new Map<number, number>();
  pickedIds.forEach((id, i) => order.set(id, i));
  batch.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  console.log(
    "\x1b[34m%s\x1b[0m",
    `Processing ${batch.length} ${
      batch.length > 1 ? "links" : "link"
    } for the following ${
      uniqueUsersWithLinks.length > 1 ? "userIds" : "userId"
    }: ${uniqueUsersWithLinks.join(", ")}`
  );

  return batch;
}
