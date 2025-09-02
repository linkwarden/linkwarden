import { prisma } from "@linkwarden/prisma";

export async function countUnprocessedBillableLinks() {
  const billedOwnerIds = process.env.STRIPE_SECRET_KEY
    ? (
        await prisma.user.findMany({
          where: {
            OR: [
              { subscriptions: { is: { active: true } } },
              { parentSubscription: { is: { active: true } } },
            ],
          },
          select: { id: true },
        })
      ).map((u) => u.id)
    : undefined;

  const count = await prisma.link.count({
    where: {
      lastPreserved: null,
      NOT: { url: null },
      ...(billedOwnerIds && billedOwnerIds.length
        ? { collection: { ownerId: { in: billedOwnerIds } } }
        : {}),
    },
  });

  return count;
}
