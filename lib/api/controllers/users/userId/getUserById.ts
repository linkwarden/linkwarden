import { prisma } from "@/lib/api/db";

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
    },
  });

  if (!user)
    return { response: "User not found or profile is private.", status: 404 };

  const whitelistedUsernames = user.whitelistedUsers?.map(
    (usernames) => usernames.username
  );

  const { password, subscriptions, ...lessSensitiveInfo } = user;

  const data = {
    ...lessSensitiveInfo,
    whitelistedUsers: whitelistedUsernames,
    subscription: {
      active: subscriptions?.active,
    },
  };

  return { response: data, status: 200 };
}
