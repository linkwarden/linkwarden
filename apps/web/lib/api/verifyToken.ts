import { NextApiRequest } from "next";
import { JWT, getToken } from "next-auth/jwt";
import { prisma } from "./db";

type Props = {
  req: NextApiRequest;
};

export default async function verifyToken({
  req,
}: Props): Promise<JWT | string> {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!userId) {
    return "You must be logged in.";
  }

  if (token.exp < Date.now() / 1000) {
    return "Your session has expired, please log in again.";
  }

  // check if token is revoked
  const revoked = await prisma.accessToken.findFirst({
    where: {
      token: token.jti,
      revoked: true,
    },
  });

  if (revoked) {
    return "Your session has expired, please log in again.";
  }

  return token;
}
