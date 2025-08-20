import Stripe from "stripe";
import stripeSDK from "./stripeSDK";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const updateSeats = async (subscriptionId: string, seats: number) => {
  if (!STRIPE_SECRET_KEY) {
    return;
  }

  const stripe = stripeSDK();

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const trialing = subscription.status === "trialing";

  if (subscription) {
    await stripe.subscriptions.update(subscriptionId, {
      billing_cycle_anchor: trialing ? undefined : "now",
      proration_behavior: trialing ? undefined : "create_prorations",
      quantity: seats,
    } as Stripe.SubscriptionUpdateParams);
  }
};

export default updateSeats;
