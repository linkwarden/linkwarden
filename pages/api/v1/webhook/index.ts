import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import handleSubscription from "@/lib/api/stripe/handleSubscription";

export const config = {
  api: {
    bodyParser: false,
  },
};

const buffer = (req: NextApiRequest) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks as any));
    });

    req.on("error", reject);
  });
};

export default async function webhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NEXT_PUBLIC_DEMO === "true")
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });

  // see if stripe is already initialized
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({
      response: "This action is disabled because Stripe is not initialized.",
    });
  }

  let event = req.body;

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });

  const signature = req.headers["stripe-signature"] as any;

  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error(err);
    return res.status(400).send("Webhook signature verification failed.");
  }

  // Handle the event based on its type
  const eventType = event.type;
  const data = event.data.object;

  try {
    switch (eventType) {
      case "customer.subscription.created":
        await handleSubscription({
          id: data.id,
          active: data.status === "active" || data.status === "trialing",
          quantity: data?.quantity ?? 1,
          periodStart: data.current_period_start,
          periodEnd: data.current_period_end,
          action: "customer.subscription.created",
        });
        break;

      case "customer.subscription.updated":
        await handleSubscription({
          id: data.id,
          active: data.status === "active" || data.status === "trialing",
          quantity: data?.quantity ?? 1,
          periodStart: data.current_period_start,
          periodEnd: data.current_period_end,
          action: "customer.subscription.updated",
        });
        break;

      case "customer.subscription.deleted":
        await handleSubscription({
          id: data.id,
          active: false,
          quantity: data?.lines?.data[0]?.quantity ?? 1,
          periodStart: data.current_period_start,
          periodEnd: data.current_period_end,
          action: "customer.subscription.deleted",
        });
        break;

      default:
        console.log(`Unhandled event type ${eventType}`);
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return res.status(500).send("Server Error");
  }

  return res.status(200).json({
    response: "Done!",
  });
}
