import { prisma } from "@/lib/api/db";

export default async function getPublicUserById(
  targetId: number | string,
  isId: boolean,
  requestingId?: number
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

  if (user?.isPrivate) {
    if (requestingId) {
      const requestingUsername = (
        await prisma.user.findUnique({ where: { id: requestingId } })
      )?.username;

      if (
        !requestingUsername ||
        !whitelistedUsernames.includes(requestingUsername?.toLowerCase())
      ) {
        return {
          response: "User not found or profile is private.",
          status: 404,
        };
      }
    } else
      return { response: "User not found or profile is private.", status: 404 };
  }

  const { password, ...lessSensitiveInfo } = user;

  const data = {
    id: lessSensitiveInfo.id,
    name: lessSensitiveInfo.name,
    username: lessSensitiveInfo.username,
    image: lessSensitiveInfo.image,
  };

  return { response: data, status: 200 };
}
