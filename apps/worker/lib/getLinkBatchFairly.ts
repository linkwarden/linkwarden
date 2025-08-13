import { prisma } from "@linkwarden/prisma";
import { Prisma } from "@linkwarden/prisma/client";

type PickLinksOptions = {
  perUserLimit: number;
  maxBatchLinks: number;
  leastNumberOfUsersPerBatch: number;
};

export default async function getLinkBatchFairly({
  perUserLimit,
  maxBatchLinks,
  leastNumberOfUsersPerBatch,
}: PickLinksOptions) {
  // Sanity: cannot include more users than links
  const minUsers = Math.min(leastNumberOfUsersPerBatch, maxBatchLinks);

  const pickedLinkIds: number[] = [];
  const pickedUserIds = new Set<number>();

  // Your existing eligibility filter (typed, no readonly)
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

  // Keyset pagination over users by (lastPickedAt ASC, id ASC)
  let lastPickedAtCursor: Date | null = null;
  let lastIdCursor: number | null = null;

  // We only count a user towards "min users" if they contribute at least 1 link
  while (pickedLinkIds.length < maxBatchLinks) {
    const baseUserWhere: Prisma.UserWhereInput = {
      subscriptions: { is: { active: true } }, // only active subscribers
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
      if (pickedLinkIds.length >= maxBatchLinks) break;

      const remainingSlots = maxBatchLinks - pickedLinkIds.length;
      const remainingUsersNeeded = Math.max(0, minUsers - pickedUserIds.size);

      // Ensure we leave at least one slot for each still‑needed user (including this user’s peers)
      // If we still need K users after this one, we must keep K slots free.
      // So the most we can take now is remainingSlots - (remainingUsersNeeded - 1).
      // (If remainingUsersNeeded === 0, we can take up to perUserLimit or remainingSlots.)
      const maxForThisUser = Math.min(
        perUserLimit,
        remainingUsersNeeded > 0
          ? Math.max(1, remainingSlots - (remainingUsersNeeded - 1))
          : remainingSlots
      );

      if (maxForThisUser <= 0) continue;

      const links = await prisma.link.findMany({
        where: {
          ...baseLinkWhere,
          collection: { is: { ownerId: u.id } },
        },
        orderBy: [
          { createdAt: "desc" }, // newest first per user
          { id: "desc" }, // tiebreaker
        ],
        take: maxForThisUser,
        select: { id: true },
      });

      if (links.length > 0) {
        for (const l of links) pickedLinkIds.push(l.id);
        pickedUserIds.add(u.id);
      }
    }

    const tail = users[users.length - 1];
    lastPickedAtCursor = tail.lastPickedAt;
    lastIdCursor = tail.id;

    // Stop early if we’ve satisfied both constraints
    if (
      pickedLinkIds.length >= maxBatchLinks &&
      pickedUserIds.size >= minUsers
    ) {
      break;
    }
  }

  console.log(
    "\x1b[34m%s\x1b[0m",
    `Processing ${
      pickedLinkIds.length
    } links for the following users: ${Array.from(pickedUserIds).join(", ")}`
  );

  if (pickedLinkIds.length === 0) return [];

  // Stamp lastPickedAt only for users that contributed links in this batch
  const now = new Date();
  await prisma.user.updateMany({
    where: { id: { in: Array.from(pickedUserIds) } },
    data: { lastPickedAt: now },
  });

  // Return same shape as your original findMany include
  const batch = await prisma.link.findMany({
    where: { id: { in: pickedLinkIds } },
    include: {
      collection: { include: { owner: true } },
      tags: true,
    },
  });

  // Preserve selection order (per-user newest first, fairness order)
  const order = new Map<number, number>();
  pickedLinkIds.forEach((id, i) => order.set(id, i));
  batch.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return batch;
}
