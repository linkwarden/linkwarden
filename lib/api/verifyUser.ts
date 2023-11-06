import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "./db";
import { User } from "@prisma/client";
import verifySubscription from "./verifySubscription";

type Props = {
  req: NextApiRequest;
  res: NextApiResponse;
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export default async function verifyUser({
  req,
  res,
}: Props): Promise<User | null> {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!userId) {
    res.status(401).json({ response: "You must be logged in." });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      subscriptions: true,
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
    const subscribedUser = verifySubscription(user);

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
