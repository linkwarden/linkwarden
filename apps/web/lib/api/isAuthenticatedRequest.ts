import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "./db";

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

  if (findUser && !findUser?.subscriptions) {
    return null;
  }

  return findUser;
}
