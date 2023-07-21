import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import paymentCheckout from "@/lib/api/paymentCheckout";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_ID = process.env.PRICE_ID;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id)
    return res.status(401).json({ response: "You must be logged in." });
  else if (!STRIPE_SECRET_KEY || !PRICE_ID) {
    return res.status(400).json({ response: "Payment is disabled." });
  }

  if (req.method === "GET") {
    const users = await paymentCheckout(
      STRIPE_SECRET_KEY,
      session?.user.email,
      PRICE_ID
    );
    return res.status(users.status).json({ response: users.response });
  }
}
