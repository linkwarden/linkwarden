import { prisma } from "@linkwarden/prisma";
import { User } from "@linkwarden/prisma/client";
import bcrypt from "bcrypt";
import {
  sendEmailVerificationCode,
  verifyEmailWithCode,
} from "@/lib/api/emailVerificationCode";

type Props = {
  username: string;
  password: string;
  code?: string;
};

export type VerifyCredentialsResult =
  | { status: "success"; user: User }
  | { status: "invalid_credentials" }
  | { status: "email_not_verified"; user: User }
  | { status: "invalid_code"; response: string };

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function verifyByCredentials({
  username,
  password,
  code,
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
    // The email is only verified with the password and the emailed code together
    if (!code) {
      if (user.email)
        await sendEmailVerificationCode(user.email).catch((e) =>
          console.error("Could not send verification code:", e)
        );

      return { status: "email_not_verified", user };
    }

    const error = await verifyEmailWithCode(user, code);

    if (error) return { status: "invalid_code", response: error };
  }

  return { status: "success", user };
}
