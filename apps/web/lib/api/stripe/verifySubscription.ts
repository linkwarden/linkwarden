import { prisma } from "@linkwarden/prisma";
import { Subscription, User } from "@linkwarden/prisma/client";
import checkSubscriptionByEmail from "./checkSubscriptionByEmail";

interface UserIncludingSubscription extends User {
  subscriptions: Subscription | null;
  parentSubscription: Subscription | null;
}

const TRIAL_PERIOD_DAYS = process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14;
const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

export default async function verifySubscription(
  user?: UserIncludingSubscription | null
) {
  if (!user) return null;

  const trialEndTime =
    new Date(user.createdAt).getTime() +
    (1 + Number(TRIAL_PERIOD_DAYS)) * 86400000; // Add 1 to account for the current day

  const daysLeft = Math.floor((trialEndTime - Date.now()) / 86400000);

  if (
    !user.subscriptions &&
    !user.parentSubscription &&
    (REQUIRE_CC || daysLeft <= 0)
  ) {
    return null;
  }

  if (user.parentSubscription?.active) {
    return user;
  }

  if (
    (!user.subscriptions?.active ||
      new Date() > user.subscriptions.currentPeriodEnd) &&
    (REQUIRE_CC || daysLeft <= 0)
  ) {
    const subscription = await checkSubscriptionByEmail(user.email as string);

    if (
      !subscription ||
      !subscription.stripeSubscriptionId ||
      !subscription.currentPeriodEnd ||
      !subscription.currentPeriodStart ||
      !subscription.quantity
    ) {
      return null;
    }

    const {
      active,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      quantity,
    } = subscription;

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
          quantity,
          userId: user.id,
        },
        update: {
          active,
          stripeSubscriptionId,
          currentPeriodStart: new Date(currentPeriodStart),
          currentPeriodEnd: new Date(currentPeriodEnd),
          quantity,
        },
      })
      .catch((err) => console.log(err));
  }

  return user;
}
