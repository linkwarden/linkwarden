import stripeSDK from "./stripeSDK";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function checkSubscriptionByEmail(email: string) {
  if (!STRIPE_SECRET_KEY) return null;

  const stripe = stripeSDK();

  console.log("Request made to Stripe by:", email);
  const customers = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions.data.items"],
  });

  const sub = customers.data[0]?.subscriptions?.data?.[0];
  if (!sub) return null;

  const item = sub.items.data[0];
  if (!item) return null;

  return {
    active: sub.status === "active" || sub.status === "trialing",
    stripeSubscriptionId: sub.id,
    currentPeriodStart: item.current_period_start * 1000,
    currentPeriodEnd: item.current_period_end * 1000,
    quantity: item.quantity ?? 1,
  };
}
