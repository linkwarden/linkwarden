// Will be deprecated soon! Moved to /api/v1/webhooks/stripe

import type { NextApiRequest, NextApiResponse } from "next";
import handleSubscription from "@/lib/api/billing/handleStripeSubscription";
import stripeSDK from "@/lib/api/billing/stripeSDK";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Matches the default body size limit of Next.js API routes
const MAX_BODY_SIZE = 1024 * 1024;

const buffer = (req: NextApiRequest, limitBytes: number) => {
  return new Promise<Buffer>((resolve, reject) => {
    if (Number(req.headers["content-length"]) > limitBytes) {
      return reject(new Error("Payload Too Large"));
    }

    const chunks: Buffer[] = [];
    let totalLength = 0;

    const onData = (chunk: Buffer) => {
      totalLength += chunk.length;

      if (totalLength > limitBytes) {
        req.off("data", onData);
        req.pause();
        return reject(new Error("Payload Too Large"));
      }

      chunks.push(chunk);
    };

    req.on("data", onData);

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

  const stripe = stripeSDK();

  const signature = req.headers["stripe-signature"] as any;

  let body: Buffer;

  try {
    body = await buffer(req, MAX_BODY_SIZE);
  } catch (err: any) {
    if (err.message === "Payload Too Large") {
      res.setHeader("Connection", "close");
      return res.status(413).send("Payload too large.");
    }
    return res.status(400).send("Invalid request body.");
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error(err);
    return res.status(400).send("Webhook signature verification failed.");
  }

  const eventType = event.type;
  const data = event.data.object;

  const item = data?.items?.data?.[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;
  const quantity = item?.quantity ?? 1;

  try {
    switch (eventType) {
      case "customer.subscription.created":
        await handleSubscription({
          id: data.id,
          active: data.status === "active" || data.status === "trialing",
          quantity,
          periodStart,
          periodEnd,
          action: "customer.subscription.created",
        });
        break;

      case "customer.subscription.updated":
        await handleSubscription({
          id: data.id,
          active: data.status === "active" || data.status === "trialing",
          quantity,
          periodStart,
          periodEnd,
          action: "customer.subscription.updated",
        });
        break;

      case "customer.subscription.deleted":
        await handleSubscription({
          id: data.id,
          active: false,
          quantity,
          periodStart,
          periodEnd,
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
