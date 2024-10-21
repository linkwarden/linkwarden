import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function checkSubscriptionByEmail(email: string) {
  if (!STRIPE_SECRET_KEY) return null;

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });

  console.log("Request made to Stripe by:", email);
  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  if (listByEmail?.data[0]?.subscriptions?.data[0]) {
    return {
      active: (listByEmail.data[0].subscriptions?.data[0] as any).plan.active,
      stripeSubscriptionId: listByEmail.data[0].subscriptions?.data[0].id,
      currentPeriodStart:
        listByEmail.data[0].subscriptions?.data[0].current_period_start * 1000,
      currentPeriodEnd:
        listByEmail.data[0].subscriptions?.data[0].current_period_end * 1000,
      quantity: (listByEmail?.data[0]?.subscriptions?.data[0] as any).quantity,
    };
  } else {
    return null;
  }
}
