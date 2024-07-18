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

  const user = await prisma.user.findUnique({
    where: {
      id: token?.id,
    },
  });

  const isServerAdmin = user?.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1);

  const userId = isServerAdmin ? Number(req.query.id) : token.id;

  if (userId !== Number(req.query.id) && !isServerAdmin)
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
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateUserById(userId, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await deleteUserById(userId, req.body, isServerAdmin);
    return res.status(updated.status).json({ response: updated.response });
  }
}
