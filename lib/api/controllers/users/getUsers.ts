import { prisma } from "@/lib/api/db";

export default async function getUser(
  lookupEmail: string,
  isSelf: boolean,
  userEmail: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email: lookupEmail,
    },
  });

  if (!user) return { response: "User not found.", status: 404 };

  if (
    !isSelf &&
    user?.isPrivate &&
    !user.whitelistedUsers.includes(userEmail)
  ) {
    return { response: "This profile is private.", status: 401 };
  }

  const { password, ...unsensitiveInfo } = user;

  const data = isSelf
    ? // If user is requesting its own data
      unsensitiveInfo
    : {
        // If user is requesting someone elses data
        id: unsensitiveInfo.id,
        name: unsensitiveInfo.name,
        email: unsensitiveInfo.email,
      };

  return { response: data || null, status: 200 };
}
