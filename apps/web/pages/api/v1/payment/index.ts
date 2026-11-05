import type { NextApiRequest, NextApiResponse } from "next";
import paymentCheckout from "@/lib/api/paymentCheckout";
import { Plan } from "@linkwarden/types/global";
import { prisma } from "@linkwarden/prisma";
import getTokenFromRequest from "@/lib/api/getTokenFromRequest";
import captureEvent from "@/lib/api/captureEvent";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const MONTHLY_PRICE_ID = process.env.MONTHLY_PRICE_ID;
  const YEARLY_PRICE_ID = process.env.YEARLY_PRICE_ID;

  const token = await getTokenFromRequest(req);

  if (!STRIPE_SECRET_KEY || !MONTHLY_PRICE_ID || !YEARLY_PRICE_ID)
    return res.status(400).json({ response: "Payment is disabled." });

  console.log(token);

  if (!token?.id) return res.status(404).json({ response: "Token invalid." });

  const user = await prisma.user.findUnique({ where: { id: token.id } });
  const email = user?.email;

  if (!user || !email)
    return res.status(404).json({ response: "User not found." });

  let PRICE_ID = MONTHLY_PRICE_ID;

  if ((Number(req.query.plan) as Plan) === Plan.monthly)
    PRICE_ID = MONTHLY_PRICE_ID;
  else if ((Number(req.query.plan) as Plan) === Plan.yearly)
    PRICE_ID = YEARLY_PRICE_ID;

  if (req.method === "GET") {
    const users = await paymentCheckout(email as string, PRICE_ID);

    // Users who already subscribed are sent back to the dashboard instead
    if (users.status === 200 && users.response !== "/dashboard")
      captureEvent({
        req,
        user,
        event: "subscription_checkout_started",
        properties: {
          plan: PRICE_ID === YEARLY_PRICE_ID ? "yearly" : "monthly",
        },
      });

    return res.status(users.status).json({ response: users.response });
  }
}
