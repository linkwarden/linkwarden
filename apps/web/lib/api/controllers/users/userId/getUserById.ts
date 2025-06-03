import { prisma } from "@linkwarden/prisma";
import { Subscription, User, WhitelistedUser } from "@linkwarden/prisma/client";

export default async function getUserById(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      whitelistedUsers: {
        select: {
          username: true,
        },
      },
      subscriptions: true,
      parentSubscription: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!user)
    return { response: "User not found or profile is private.", status: 404 };

  const whitelistedUsernames = user.whitelistedUsers?.map(
    (usernames) => usernames.username
  );

  const { password, subscriptions, parentSubscription, ...lessSensitiveInfo } =
    user;

  const data = {
    ...lessSensitiveInfo,
    whitelistedUsers: whitelistedUsernames,
    subscription: {
      active: subscriptions?.active,
      quantity: subscriptions?.quantity,
    },
    parentSubscription: {
      active: parentSubscription?.active,
      user: {
        email: parentSubscription?.user.email,
      },
    },
  } as Omit<User, "password"> &
    Partial<WhitelistedUser> &
    Partial<Subscription>;

  return { response: data, status: 200 };
}
