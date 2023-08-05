import { prisma } from "@/lib/api/db";

export default async function getUser({
  params,
  isSelf,
  username,
}: {
  params: {
    lookupUsername?: string;
    lookupId?: number;
  };
  isSelf: boolean;
  username: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      id: params.lookupId,
      username: params.lookupUsername?.toLowerCase(),
    },
    include: {
      whitelistedUsers: {
        select: {
          username: true
        }
      }
    }
  });

  if (!user) return { response: "User not found.", status: 404 };

  const whitelistedUsernames = user.whitelistedUsers?.map(usernames => usernames.username);

  if (
    !isSelf &&
    user?.isPrivate &&
    !whitelistedUsernames.includes(username.toLowerCase())
  ) {
    return { response: "This profile is private.", status: 401 };
  }

  const { password, ...lessSensitiveInfo } = user;

  const data = isSelf
    ? // If user is requesting its own data
      {...lessSensitiveInfo, whitelistedUsers: whitelistedUsernames}
    : {
        // If user is requesting someone elses data
        id: lessSensitiveInfo.id,
        name: lessSensitiveInfo.name,
        username: lessSensitiveInfo.username,
      };

  return { response: data || null, status: 200 };
}
