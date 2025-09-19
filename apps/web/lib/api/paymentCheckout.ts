import verifySubscription from "./stripe/verifySubscription";
import { prisma } from "@linkwarden/prisma";
import stripeSDK from "./stripe/stripeSDK";

const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";
const MANAGED_PAYMENTS_ENABLED =
  process.env.MANAGED_PAYMENTS_ENABLED === "true";

export default async function paymentCheckout(email: string, priceId: string) {
  const stripe = stripeSDK();

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
    ...(REQUIRE_CC
      ? {
          subscription_data: {
            trial_period_days: NEXT_PUBLIC_TRIAL_PERIOD_DAYS
              ? Number(NEXT_PUBLIC_TRIAL_PERIOD_DAYS)
              : 14,
          },
        }
      : {}),
    ...(MANAGED_PAYMENTS_ENABLED
      ? {
          managed_payments: {
            enabled: true,
          },
        }
      : {
          automatic_tax: {
            enabled: true,
          },
        }),
  });

  return { response: session.url, status: 200 };
}
