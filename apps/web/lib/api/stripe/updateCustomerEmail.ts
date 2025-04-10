import Stripe from "stripe";

export default async function updateCustomerEmail(
  stripeSecretKey: string,
  email: string,
  newEmail: string
) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  const customer = listByEmail.data.find((customer, i) => {
    const hasValidSubscription = customer.subscriptions?.data.some(
      (subscription) => {
        const NEXT_PUBLIC_TRIAL_PERIOD_DAYS =
          process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS;
        const secondsInTwoWeeks = NEXT_PUBLIC_TRIAL_PERIOD_DAYS
          ? Number(NEXT_PUBLIC_TRIAL_PERIOD_DAYS) * 86400
          : 1209600;

        const isNotCanceledOrHasTime = !(
          subscription.canceled_at &&
          new Date() >
            new Date((subscription.canceled_at + secondsInTwoWeeks) * 1000)
        );

        return subscription?.items?.data[0].plan && isNotCanceledOrHasTime;
      }
    );

    return (
      customer.email?.toLowerCase() === email.toLowerCase() &&
      hasValidSubscription
    );
  });

  if (customer)
    await stripe.customers.update(customer?.id, {
      email: newEmail.toLowerCase(),
    });
}
