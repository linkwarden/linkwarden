import type { NextApiRequest, NextApiResponse } from "next";
import paymentCheckout from "@/lib/api/paymentCheckout";
import { Plan } from "@/types/global";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const MONTHLY_PRICE_ID = process.env.MONTHLY_PRICE_ID;
  const YEARLY_PRICE_ID = process.env.YEARLY_PRICE_ID;

  if (!STRIPE_SECRET_KEY || !MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
    return res.status(400).json({ response: "Payment is disabled." });
  }

  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  let PRICE_ID = MONTHLY_PRICE_ID;

  if ((Number(req.query.plan) as unknown as Plan) === Plan.monthly)
    PRICE_ID = MONTHLY_PRICE_ID;
  else if ((Number(req.query.plan) as unknown as Plan) === Plan.yearly)
    PRICE_ID = YEARLY_PRICE_ID;

  if (req.method === "GET") {
    const users = await paymentCheckout(
      STRIPE_SECRET_KEY,
      user.email as string,
      PRICE_ID
    );
    return res.status(users.status).json({ response: users.response });
  }
}
