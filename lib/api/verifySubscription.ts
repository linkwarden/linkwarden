import { prisma } from "./db";
import { Subscription, User } from "@prisma/client";
import checkSubscriptionByEmail from "./checkSubscriptionByEmail";

interface UserIncludingSubscription extends User {
  subscriptions: Subscription | null;
}

export default async function verifySubscription(
  user?: UserIncludingSubscription
) {
  if (!user) {
    return null;
  }

  const subscription = user.subscriptions;

  const currentDate = new Date();

  if (!subscription?.active || currentDate > subscription.currentPeriodEnd) {
    const {
      active,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
    } = await checkSubscriptionByEmail(user.email as string);

    if (
      active &&
      stripeSubscriptionId &&
      currentPeriodStart &&
      currentPeriodEnd
    ) {
      await prisma.subscription
        .upsert({
          where: {
            userId: user.id,
          },
          create: {
            active,
            stripeSubscriptionId,
            currentPeriodStart: new Date(currentPeriodStart),
            currentPeriodEnd: new Date(currentPeriodEnd),
            userId: user.id,
          },
          update: {
            active,
            stripeSubscriptionId,
            currentPeriodStart: new Date(currentPeriodStart),
            currentPeriodEnd: new Date(currentPeriodEnd),
          },
        })
        .catch((err) => console.log(err));
    } else if (!active) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (subscription)
        await prisma.subscription.delete({
          where: {
            userId: user.id,
          },
        });

      return null;
    }
  }

  return user;
}
