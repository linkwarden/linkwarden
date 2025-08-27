import Stripe from "stripe";

export default function stripeSDK() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is not defined");
  }

  const stripe = new Stripe(secretKey, {
    // @ts-ignore
    apiVersion: process.env.STRIPE_API_VERSION || "2025-07-30.basil",
  });

  return stripe;
}
