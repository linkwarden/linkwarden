import { prisma } from "@/lib/api/db";

export default async function exportData(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      collections: {
        include: {
          rssSubscriptions: true,
          links: {
            include: {
              tags: true,
            },
          },
        },
      },
      pinnedLinks: true,
      whitelistedUsers: true,
    },
  });

  if (!user) return { response: "User not found.", status: 404 };

  const { password, id, ...userData } = user;

  return { response: userData, status: 200 };
}
