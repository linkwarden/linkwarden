import { prisma } from "@linkwarden/prisma";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;
const stripeEnabled = process.env.STRIPE_SECRET_KEY;

export const hasPassedLimit = async (
  userId: number,
  numberOfImports: number
) => {
  if (!stripeEnabled) {
    const totalLinks = await prisma.link.count({
      where: {
        createdById: userId,
      },
    });

    return MAX_LINKS_PER_USER - (numberOfImports + totalLinks) < 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      parentSubscriptionId: true,
      subscriptions: { select: { id: true, quantity: true } },
    },
  });

  if (!user) {
    return true;
  }

  const subscriptionId = user?.parentSubscriptionId ?? user?.subscriptions?.id;
  let quantity = user?.subscriptions?.quantity;

  if (!quantity) {
    quantity = (
      await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { quantity: true },
      })
    )?.quantity;
  }

  if (!subscriptionId || !quantity) return true;

  if (user.parentSubscriptionId) {
    const childCount = await prisma.user.count({
      where: { parentSubscriptionId: subscriptionId },
    });

    if (!childCount || childCount + 1 > quantity) {
      return true;
    }
  }

  if (
    user.parentSubscriptionId ||
    (user.subscriptions && user.subscriptions?.quantity > 1)
  ) {
    // Calculate the total allowed links for the organization
    const totalCapacity = quantity * MAX_LINKS_PER_USER;

    const totalLinks = await prisma.link.count({
      where: {
        createdBy: {
          OR: [
            {
              parentSubscriptionId: subscriptionId || undefined,
            },
            {
              subscriptions: {
                id: subscriptionId || undefined,
              },
            },
          ],
        },
      },
    });

    return totalCapacity - (numberOfImports + totalLinks) < 0;
  } else {
    const totalLinks = await prisma.link.count({
      where: {
        createdById: userId,
      },
    });

    return MAX_LINKS_PER_USER - (numberOfImports + totalLinks) < 0;
  }
};
