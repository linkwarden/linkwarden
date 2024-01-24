import type { NextApiRequest, NextApiResponse } from "next";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import updateUserById from "@/lib/api/controllers/users/userId/updateUserById";
import deleteUserById from "@/lib/api/controllers/users/userId/deleteUserById";
import { prisma } from "@/lib/api/db";
import verifySubscription from "@/lib/api/verifySubscription";
import verifyToken from "@/lib/api/verifyToken";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const token = await verifyToken({ req });

  if (typeof token === "string") {
    res.status(401).json({ response: token });
    return null;
  }

  const userId = token?.id;

  if (userId !== Number(req.query.id))
    return res.status(401).json({ response: "Permission denied." });

  if (req.method === "GET") {
    const users = await getUserById(userId);
    return res.status(users.status).json({ response: users.response });
  }

  if (STRIPE_SECRET_KEY) {
    const user = await prisma.user.findUnique({
      where: {
        id: token.id,
      },
      include: {
        subscriptions: true,
      },
    });

    if (user) {
      const subscribedUser = await verifySubscription(user);
      if (!subscribedUser) {
        return res.status(401).json({
          response:
            "You are not a subscriber, feel free to reach out to us at support@linkwarden.app if you think this is an issue.",
        });
      }
    } else {
      return res.status(404).json({ response: "User not found." });
    }
  }

  if (req.method === "PUT") {
    const updated = await updateUserById(userId, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    const updated = await deleteUserById(userId, req.body);
    return res.status(updated.status).json({ response: updated.response });
  }
}
