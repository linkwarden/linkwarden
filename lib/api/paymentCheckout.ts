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

  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  const isExistingCostomer = listByEmail?.data[0]?.id || undefined;

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
