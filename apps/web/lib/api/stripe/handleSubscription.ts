import Stripe from "stripe";
import { prisma } from "../db";

type Data = {
  id: string;
  active: boolean;
  quantity: number;
  periodStart: number;
  periodEnd: number;
  action:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted";
};

export default async function handleSubscription({
  id,
  active,
  quantity,
  periodStart,
  periodEnd,
  action,
}: Data) {
  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: id,
    },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: id,
      },
      data: {
        active,
        quantity,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
    });
    return;
  } else {
    if (!process.env.STRIPE_SECRET_KEY)
      throw new Error("Missing Stripe secret key");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    const subscription = await stripe.subscriptions.retrieve(id);
    const customerId = subscription.customer;

    const customer = await stripe.customers.retrieve(customerId.toString());
    const email = (customer as Stripe.Customer).email;

    if (!email) throw new Error("Email not found");

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      if (action === "customer.subscription.deleted") {
        return "User not found or deleted";
      } else {
        throw new Error("User not found");
      }
    }

    const userId = user.id;

    await prisma.subscription
      .upsert({
        where: {
          userId,
        },
        create: {
          active,
          stripeSubscriptionId: id,
          quantity,
          currentPeriodStart: new Date(periodStart * 1000),
          currentPeriodEnd: new Date(periodEnd * 1000),
          user: {
            connect: {
              id: userId,
            },
          },
        },
        update: {
          active,
          stripeSubscriptionId: id,
          quantity,
          currentPeriodStart: new Date(periodStart * 1000),
          currentPeriodEnd: new Date(periodEnd * 1000),
        },
      })
      .catch((err) => console.log(err));
  }
}
