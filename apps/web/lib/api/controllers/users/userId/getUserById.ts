import { prisma } from "@linkwarden/prisma";
import { Subscription, User } from "@linkwarden/prisma/client";

type GetUserByIdResponse = Omit<User, "password"> &
  Partial<{ subscription: Pick<Subscription, "active" | "quantity"> }> & {
    parentSubscription: {
      active: boolean | undefined;
      user: {
        email: string | null | undefined;
      };
    };
  } & {
    whitelistedUsers: string[];
  }

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
      dashboardSections: true,
    },
  });

  if (!user)
    return { response: "User not found or profile is private.", status: 404 };

  const whitelistedUsernames = user.whitelistedUsers?.map(
    (usernames) => usernames.username
  );

  const { password, subscriptions, parentSubscription, ...lessSensitiveInfo } =
    user;

  const data: GetUserByIdResponse = {
    ...lessSensitiveInfo,
    whitelistedUsers: whitelistedUsernames,
    subscription: {
      active: subscriptions?.active ?? false,
      quantity: subscriptions?.quantity ?? 0,
    },
    parentSubscription: {
      active: parentSubscription?.active,
      user: {
        email: parentSubscription?.user.email,
      },
    },
  }

  return { response: data, status: 200 };
}
