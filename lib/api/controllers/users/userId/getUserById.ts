import { prisma } from "@/lib/api/db";

export default async function getUser(userId: number) {
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
    },
  });

  if (!user)
    return { response: "User not found or profile is private.", status: 404 };

  const whitelistedUsernames = user.whitelistedUsers?.map(
    (usernames) => usernames.username
  );

  const { password, ...lessSensitiveInfo } = user;

  const data = {
    ...lessSensitiveInfo,
    whitelistedUsers: whitelistedUsernames,
  };

  return { response: data, status: 200 };
}
