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
      OR: [
        {
          subscriptions: process.env.STRIPE_SECRET_KEY
            ? { is: { active: true } }
            : undefined,
        },
        {
          parentSubscription: process.env.STRIPE_SECRET_KEY
            ? { is: { active: true } }
            : undefined,
        },
      ],
    },
    orderBy: [{ lastPickedAt: "asc" }, { id: "asc" }],
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

  const usersWithLinks = [...linkUserMap.values()]
    .flat()
    .filter((count) => count > 0);

  const pickedLinkIds: number[] = [];

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
    where: { id: { in: usersWithLinks } },
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
      usersWithLinks.length > 1 ? "userIds" : "userId"
    }: ${usersWithLinks.join(", ")}`
  );

  return batch;
}

export async function oldGetLinkBatchFairly({
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

  const candidateUserIds: number[] = [];
  let lastPickedAtCursor: Date | null = null;
  let lastIdCursor: number | null = null;

  while (candidateUserIds.length < maxBatchLinks) {
    const baseUserWhere: Prisma.UserWhereInput = {
      subscriptions: { is: { active: true } },
    };
    const userWhere: Prisma.UserWhereInput =
      lastPickedAtCursor && lastIdCursor
        ? {
            AND: [
              baseUserWhere,
              {
                OR: [
                  { lastPickedAt: { gt: lastPickedAtCursor } },
                  {
                    AND: [
                      { lastPickedAt: { equals: lastPickedAtCursor } },
                      { id: { gt: lastIdCursor } },
                    ],
                  },
                ],
              },
            ],
          }
        : baseUserWhere;

    const users = await prisma.user.findMany({
      where: userWhere,
      orderBy: [{ lastPickedAt: "asc" }, { id: "asc" }],
      select: { id: true, lastPickedAt: true },
    });

    if (users.length === 0) break;

    for (const u of users) {
      if (candidateUserIds.length >= maxBatchLinks) break;

      const oneLink = await prisma.link.findFirst({
        where: { ...baseLinkWhere, collection: { is: { ownerId: u.id } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });

      if (oneLink) candidateUserIds.push(u.id);
    }

    const tail = users[users.length - 1];
    lastPickedAtCursor = tail.lastPickedAt;
    lastIdCursor = tail.id;
  }

  if (candidateUserIds.length === 0) return [];

  const U = candidateUserIds.length;
  const perUserCap = Math.ceil(maxBatchLinks / U);

  const pickedLinkIds: number[] = [];
  const pickedUserIds = new Set<number>();

  for (const userId of candidateUserIds) {
    if (pickedLinkIds.length >= maxBatchLinks) break;

    const remaining = maxBatchLinks - pickedLinkIds.length;
    const take = Math.min(perUserCap, remaining);

    const links = await prisma.link.findMany({
      where: { ...baseLinkWhere, collection: { is: { ownerId: userId } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: { id: true },
    });

    if (links.length > 0) {
      for (const l of links) pickedLinkIds.push(l.id);
      pickedUserIds.add(userId);
    }
  }

  console.log(
    "\x1b[34m%s\x1b[0m",
    `Processing ${
      pickedLinkIds.length
    } links for the following users: ${Array.from(pickedUserIds).join(", ")}`
  );

  if (pickedLinkIds.length === 0) return [];

  const now = new Date();
  await prisma.user.updateMany({
    where: { id: { in: Array.from(pickedUserIds) } },
    data: { lastPickedAt: now },
  });

  const batch = await prisma.link.findMany({
    where: { id: { in: pickedLinkIds } },
    include: {
      collection: { include: { owner: true } },
      tags: true,
    },
  });

  const order = new Map<number, number>();
  pickedLinkIds.forEach((id, i) => order.set(id, i));
  batch.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return batch;
}
