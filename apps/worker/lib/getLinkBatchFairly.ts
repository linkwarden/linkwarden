import { prisma } from "@linkwarden/prisma";

type Options = {
  usersPerRound: number;
  perUserCap: number;
  batchLimit: number;
  overfetchFactor?: number;
};

export async function getLinkBatchFairly(opts: Options) {
  const { usersPerRound, perUserCap, batchLimit, overfetchFactor = 3 } = opts;

  const candidates = await prisma.user.findMany({
    where: {
      subscriptions: {
        is: {
          active: true,
          currentPeriodEnd: { gt: new Date() },
        },
      },
      collections: {
        some: {
          links: {
            some: {
              url: { not: null },
              OR: [
                { lastPreserved: null },
                {
                  aiTagged: false,
                  createdBy: {
                    aiTagExistingLinks: true,
                    NOT: { aiTaggingMethod: "DISABLED" },
                  },
                },
              ],
            },
          },
        },
      },
    },
    orderBy: { lastPickedAt: "asc" },
    take: usersPerRound,
    select: { id: true },
  });

  console.log("Found candidates:", candidates);

  if (candidates.length === 0) return [];

  const ownerIds = candidates.map((u) => u.id);

  const targetCount = Math.min(
    batchLimit * overfetchFactor,
    usersPerRound * perUserCap * overfetchFactor
  );

  const links = await prisma.link.findMany({
    where: {
      url: { not: null },
      collection: { ownerId: { in: ownerIds } },
      OR: [
        { lastPreserved: null },
        {
          aiTagged: false,
          createdBy: {
            aiTagExistingLinks: true,
            NOT: { aiTaggingMethod: "DISABLED" },
          },
        },
      ],
    },
    include: {
      collection: { include: { owner: true } },
      tags: true,
    },
    orderBy: { id: "desc" },
    take: targetCount,
  });

  if (links.length === 0) return [];

  const perUserPicked: Record<number, number> = {};
  const picked: typeof links = [];

  for (const l of links) {
    const ownerId = l.collection.ownerId;
    const count = perUserPicked[ownerId] ?? 0;
    if (count < perUserCap) {
      perUserPicked[ownerId] = count + 1;
      picked.push(l);
      if (picked.length >= batchLimit) break;
    }
  }

  if (picked.length === 0) return [];

  const touchedUserIds = [...new Set(picked.map((l) => l.collection.ownerId))];

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: touchedUserIds } },
      data: { lastPickedAt: new Date() },
    }),
  ]);

  return picked;
}
