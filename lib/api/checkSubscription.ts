import Stripe from "stripe";

export default async function checkSubscription(
  stripeSecretKey: string,
  email: string,
  priceId: string
) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  let subscriptionCanceledAt: number | null | undefined;

  const isSubscriber = listByEmail.data.some((customer, i) => {
    const hasValidSubscription = customer.subscriptions?.data.some(
      (subscription) => {
        const NEXT_PUBLIC_TRIAL_PERIOD_DAYS =
          process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS;
        const secondsInTwoWeeks = NEXT_PUBLIC_TRIAL_PERIOD_DAYS
          ? Number(NEXT_PUBLIC_TRIAL_PERIOD_DAYS) * 86400
          : 1209600;

        subscriptionCanceledAt = subscription.canceled_at;

        const isNotCanceledOrHasTime = !(
          subscription.canceled_at &&
          new Date() >
            new Date((subscription.canceled_at + secondsInTwoWeeks) * 1000)
        );

        return (
          subscription?.items?.data?.some(
            (subscriptionItem) => subscriptionItem?.plan?.id === priceId
          ) && isNotCanceledOrHasTime
        );
      }
    );

    return (
      customer.email?.toLowerCase() === email.toLowerCase() &&
      hasValidSubscription
    );
  });

  return {
    isSubscriber,
    subscriptionCanceledAt,
  };
}
