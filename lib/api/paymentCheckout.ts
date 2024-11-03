import Stripe from "stripe";
import verifySubscription from "./stripe/verifySubscription";
import { prisma } from "./db";

export default async function paymentCheckout(
  stripeSecretKey: string,
  email: string,
  priceId: string
) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
    include: {
      subscriptions: true,
      parentSubscription: true,
    },
  });

  const subscription = await verifySubscription(user);

  if (subscription) {
    // To prevent users from creating multiple subscriptions
    return { response: "/dashboard", status: 200 };
  }

  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  const isExistingCustomer = listByEmail?.data[0]?.id || undefined;

  const NEXT_PUBLIC_TRIAL_PERIOD_DAYS =
    process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS;

  const session = await stripe.checkout.sessions.create({
    customer: isExistingCustomer ? isExistingCustomer : undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    customer_email: isExistingCustomer ? undefined : email.toLowerCase(),
    success_url: `${process.env.BASE_URL}/dashboard`,
    cancel_url: `${process.env.BASE_URL}/login`,
    automatic_tax: {
      enabled: true,
    },
    subscription_data: {
      trial_period_days: NEXT_PUBLIC_TRIAL_PERIOD_DAYS
        ? Number(NEXT_PUBLIC_TRIAL_PERIOD_DAYS)
        : 14,
    },
  });

  return { response: session.url, status: 200 };
}
