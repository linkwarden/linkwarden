import { prisma } from "@linkwarden/prisma";
import { User } from "@linkwarden/prisma/client";
import bcrypt from "bcrypt";

type Props = {
  username: string;
  password: string;
};

export type VerifyCredentialsResult =
  | { status: "success"; user: User }
  | { status: "invalid_credentials" }
  | { status: "email_not_verified"; user: User };

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function verifyByCredentials({
  username,
  password,
}: Props): Promise<VerifyCredentialsResult> {
  const user = await prisma.user.findFirst({
    where: emailEnabled
      ? {
          OR: [
            {
              username: username.toLowerCase(),
            },
            {
              email: username?.toLowerCase(),
            },
          ],
        }
      : {
          username: username.toLowerCase(),
        },
    include: {
      subscriptions: true,
      parentSubscription: true,
    },
  });

  if (!user || !user.password) {
    return { status: "invalid_credentials" };
  }

  const passwordMatches = bcrypt.compareSync(password, user.password);

  if (!passwordMatches) {
    return { status: "invalid_credentials" };
  }

  if (emailEnabled && !user.emailVerified) {
    return { status: "email_not_verified", user };
  }

  return { status: "success", user };
}
