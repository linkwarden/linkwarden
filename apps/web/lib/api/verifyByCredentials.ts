import { prisma } from "./db";
import { User } from "@prisma/client";
import verifySubscription from "./stripe/verifySubscription";
import bcrypt from "bcrypt";

type Props = {
  username: string;
  password: string;
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function verifyByCredentials({
  username,
  password,
}: Props): Promise<User | null> {
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

  if (!user) {
    return null;
  }

  let passwordMatches: boolean = false;

  if (user?.password) {
    passwordMatches = bcrypt.compareSync(password, user.password);

    if (!passwordMatches) {
      return null;
    } else {
      if (STRIPE_SECRET_KEY) {
        const subscribedUser = await verifySubscription(user);

        if (!subscribedUser) {
          return null;
        }
      }
      return user;
    }
  } else {
    return null;
  }
}
