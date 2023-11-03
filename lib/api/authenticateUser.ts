import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "./db";
import { User } from "@prisma/client";

type Props = {
  req: NextApiRequest;
  res: NextApiResponse;
};

export default async function authenticateUser({
  req,
  res,
}: Props): Promise<User | null> {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!userId) {
    res.status(401).json({ message: "You must be logged in." });
    return null;
  } else if (process.env.STRIPE_SECRET_KEY && token.isSubscriber === false) {
    res.status(401).json({
      message:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app if you think this is an issue.",
    });
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}
