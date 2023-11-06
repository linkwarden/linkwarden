import Stripe from "stripe";

const MONTHLY_PRICE_ID = process.env.MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.YEARLY_PRICE_ID;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function checkSubscriptionByEmail(email: string) {
  let active: boolean | undefined,
    stripeSubscriptionId: string | undefined,
    currentPeriodStart: number | undefined,
    currentPeriodEnd: number | undefined;

  if (!STRIPE_SECRET_KEY)
    return {
      active,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
    };

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });

  console.log("Request made to Stripe by:", email);
  const listByEmail = await stripe.customers.list({
    email: email.toLowerCase(),
    expand: ["data.subscriptions"],
  });

  listByEmail.data.some((customer) => {
    customer.subscriptions?.data.some((subscription) => {
      subscription.current_period_end;

      active = subscription.items.data.some(
        (e) =>
          (e.price.id === MONTHLY_PRICE_ID && e.price.active === true) ||
          (e.price.id === YEARLY_PRICE_ID && e.price.active === true)
      );
      stripeSubscriptionId = subscription.id;
      currentPeriodStart = subscription.current_period_start * 1000;
      currentPeriodEnd = subscription.current_period_end * 1000;
    });
  });

  return {
    active,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
  };
}
