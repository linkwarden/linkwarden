import { prisma } from "./db";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;
const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE === "true";

export const hasPassedLimit = async (
  userId: number,
  numberOfImports: number
) => {
  if (!stripeEnabled) {
    const totalLinks = await prisma.link.count({
      where: {
        createdBy: {
          id: userId,
        },
      },
    });

    return MAX_LINKS_PER_USER - (numberOfImports + totalLinks) < 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      parentSubscription: true,
      subscriptions: true,
    },
  });

  if (!user) {
    return true;
  }

  if (
    user.parentSubscription ||
    (user.subscriptions && user.subscriptions?.quantity > 1)
  ) {
    const subscription = user.parentSubscription || user.subscriptions;

    if (!subscription) {
      return true;
    }

    // Calculate the total allowed links for the organization
    const totalCapacity = subscription.quantity * MAX_LINKS_PER_USER;

    const totalLinks = await prisma.link.count({
      where: {
        createdBy: {
          OR: [
            {
              parentSubscriptionId: subscription.id || undefined,
            },
            {
              subscriptions: {
                id: subscription.id || undefined,
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
        createdBy: {
          id: userId,
        },
      },
    });

    return MAX_LINKS_PER_USER - (numberOfImports + totalLinks) < 0;
  }
};
