import { prisma } from "@/lib/api/db";

export default async function getPublicUserById(
  targetId: number | string,
  isId: boolean,
  requestingUsername?: string
) {
  const user = await prisma.user.findUnique({
    where: isId
      ? {
          id: Number(targetId) as number,
        }
      : {
          username: targetId as string,
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

  if (
    user?.isPrivate &&
    (!requestingUsername ||
      !whitelistedUsernames.includes(requestingUsername?.toLowerCase()))
  ) {
    return { response: "User not found or profile is private.", status: 404 };
  }

  const { password, ...lessSensitiveInfo } = user;

  const data = {
    name: lessSensitiveInfo.name,
    username: lessSensitiveInfo.username,
  };

  return { response: data, status: 200 };
}
