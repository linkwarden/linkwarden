import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import paymentCheckout from "@/lib/api/paymentCheckout";
import { Plan } from "@/types/global";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const MONTHLY_PRICE_ID = process.env.MONTHLY_PRICE_ID;
  const YEARLY_PRICE_ID = process.env.YEARLY_PRICE_ID;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id)
    return res.status(401).json({ response: "You must be logged in." });
  else if (!STRIPE_SECRET_KEY || !MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
    return res.status(400).json({ response: "Payment is disabled." });
  }

  let PRICE_ID = MONTHLY_PRICE_ID;

  if ((Number(req.query.plan) as unknown as Plan) === Plan.monthly)
    PRICE_ID = MONTHLY_PRICE_ID;
  else if ((Number(req.query.plan) as unknown as Plan) === Plan.yearly)
    PRICE_ID = YEARLY_PRICE_ID;

  if (req.method === "GET") {
    const users = await paymentCheckout(
      STRIPE_SECRET_KEY,
      session?.user.email,
      PRICE_ID
    );
    return res.status(users.status).json({ response: users.response });
  }
}
