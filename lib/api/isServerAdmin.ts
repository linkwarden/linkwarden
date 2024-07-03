import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "./db";

type Props = {
  req: NextApiRequest;
};

export default async function isServerAdmin({ req }: Props): Promise<boolean> {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!userId) {
    return false;
  }

  if (token.exp < Date.now() / 1000) {
    return false;
  }

  // check if token is revoked
  const revoked = await prisma.accessToken.findFirst({
    where: {
      token: token.jti,
      revoked: true,
    },
  });

  if (revoked) {
    return false;
  }

  const findUser = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (findUser?.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1)) {
    return true;
  } else {
    return false;
  }
}
