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

  if (
    subscription &&
    currentDate > subscription.currentPeriodEnd &&
    !subscription.active
  ) {
    return null;
  }

  if (!subscription || currentDate > subscription.currentPeriodEnd) {
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
    }

    if (!active) {
      if (user.username)
        // await prisma.user.update({
        //   where: { id: user.id },
        //   data: { username: null },
        // });
        return null;
    }
  }

  return user;
}
