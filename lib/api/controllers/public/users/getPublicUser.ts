import { prisma } from "@/lib/api/db";

export default async function getPublicUser(
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

  const isInAPublicCollection = await prisma.collection.findFirst({
    where: {
      ["OR"]: [
        { ownerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      ],
      isPublic: true,
    },
  });

  if (user?.isPrivate && !isInAPublicCollection) {
    if (requestingId) {
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingId },
      });

      if (
        requestingUser?.id !== requestingId &&
        (!requestingUser?.username ||
          !whitelistedUsernames.includes(
            requestingUser.username?.toLowerCase()
          ))
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
    archiveAsScreenshot: lessSensitiveInfo.archiveAsScreenshot,
    archiveAsPDF: lessSensitiveInfo.archiveAsPDF,
  };

  return { response: data, status: 200 };
}
