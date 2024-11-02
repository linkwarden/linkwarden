import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./db";
import { User } from "@prisma/client";
import verifySubscription from "./stripe/verifySubscription";
import verifyToken from "./verifyToken";

type Props = {
  req: NextApiRequest;
  res: NextApiResponse;
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function verifyUser({
  req,
  res,
}: Props): Promise<User | null> {
  const token = await verifyToken({ req });

  if (typeof token === "string") {
    res.status(401).json({ response: token });
    return null;
  }

  const userId = token?.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      subscriptions: true,
      parentSubscription: true,
    },
  });

  if (!user) {
    res.status(404).json({ response: "User not found." });
    return null;
  }

  if (!user.username) {
    res.status(401).json({
      response: "Username not found.",
    });
    return null;
  }

  if (STRIPE_SECRET_KEY) {
    const subscribedUser = await verifySubscription(user);

    if (!subscribedUser) {
      res.status(401).json({
        response:
          "You are not a subscriber, feel free to reach out to us at support@linkwarden.app if you think this is an issue.",
      });
      return null;
    }
  }

  return user;
}
