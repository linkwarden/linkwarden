import Stripe from "stripe";

export default async function updateCustomerEmail(
  stripeSecretKey: string,
  priceId: string,
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
        const secondsInTwoWeeks = 1209600;

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

  if (customer)
    await stripe.customers.update(customer?.id, {
      email: newEmail.toLowerCase(),
    });
}
