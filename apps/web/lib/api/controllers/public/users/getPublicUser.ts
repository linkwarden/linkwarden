import { prisma } from "@linkwarden/prisma";

export default async function getPublicUser(
  targetId: number | string,
  isId: boolean
) {
  const user = await prisma.user.findFirst({
    where: isId
      ? {
          id: Number(targetId) as number,
        }
      : {
          OR: [
            {
              username: targetId as string,
            },
            {
              email: targetId as string,
            },
          ],
        },
  });

  if (!user || !user.id) return { response: "User not found.", status: 404 };

  const { password, ...lessSensitiveInfo } = user;

  const data = {
    id: lessSensitiveInfo.id,
    name: lessSensitiveInfo.name,
    username: lessSensitiveInfo.username,
    email: lessSensitiveInfo.email,
    image: lessSensitiveInfo.image,
    archiveAsScreenshot: lessSensitiveInfo.archiveAsScreenshot,
    archiveAsMonolith: lessSensitiveInfo.archiveAsMonolith,
    archiveAsPDF: lessSensitiveInfo.archiveAsPDF,
  };

  return { response: data, status: 200 };
}
