import Stripe from "stripe";
import checkSubscription from "./checkSubscription";

export default async function paymentCheckout(
  stripeSecretKey: string,
  email: string,
  priceId: string
) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

  // const a = await stripe.prices.retrieve("price_1NTn3PDaRUw6CJPLkw4dcwlJ");

  // const listBySub = await stripe.subscriptions.list({
  //   customer: "cus_OGUzJrRea8Qbxx",
  // });

  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  const isExistingCostomer = listByEmail?.data[0]?.id || undefined;

  // const hasPreviouslySubscribed = listByEmail.data.find((customer, i) => {
  //   const hasValidSubscription = customer.subscriptions?.data.some(
  //     (subscription) => {
  //       return subscription?.items?.data?.some(
  //         (subscriptionItem) => subscriptionItem?.plan?.id === priceId
  //       );
  //     }
  //   );

  //   return (
  //     customer.email?.toLowerCase() === email.toLowerCase() &&
  //     hasValidSubscription
  //   );
  // });

  // const previousSubscriptionId =
  //   hasPreviouslySubscribed?.subscriptions?.data[0].id;

  // if (previousSubscriptionId) {
  //   console.log(previousSubscriptionId);
  //   const subscription = await stripe.subscriptions.resume(
  //     previousSubscriptionId
  //   );
  // }

  const TRIAL_PERIOD_DAYS = process.env.TRIAL_PERIOD_DAYS;
  const session = await stripe.checkout.sessions.create({
    customer: isExistingCostomer ? isExistingCostomer : undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    customer_email: isExistingCostomer ? undefined : email.toLowerCase(),
    success_url: "http://localhost:3000?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/login",
    automatic_tax: {
      enabled: true,
    },
    subscription_data: {
      trial_period_days: TRIAL_PERIOD_DAYS ? Number(TRIAL_PERIOD_DAYS) : 14,
    },
  });

  return { response: session.url, status: 200 };
}
