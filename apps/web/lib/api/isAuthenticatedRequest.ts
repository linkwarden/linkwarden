import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

type Props = {
  req: NextApiRequest;
};

export default async function isAuthenticatedRequest({ req }: Props) {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!userId) {
    return null;
  }

  if (token.exp < Date.now() / 1000) {
    return null;
  }

  // check if token is revoked
  const revoked = await prisma.accessToken.findFirst({
    where: {
      token: token.jti,
      revoked: true,
    },
  });

  if (revoked) {
    return null;
  }

  const findUser = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      subscriptions: true,
    },
  });

  if (STRIPE_SECRET_KEY && findUser && !findUser?.subscriptions) {
    return null;
  }

  return findUser;
}
