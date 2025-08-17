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

  const candidateUserIds: number[] = [];
  let lastPickedAtCursor: Date | null = null;
  let lastIdCursor: number | null = null;

  while (candidateUserIds.length < maxBatchLinks) {
    const baseUserWhere: Prisma.UserWhereInput = {
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
