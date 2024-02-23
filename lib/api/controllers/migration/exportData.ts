import { prisma } from "@/lib/api/db";

export default async function exportData(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      collections: {
        include: {
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

  function redactIds(obj: any) {
    if (Array.isArray(obj)) {
      obj.forEach((o) => redactIds(o));
    } else if (obj !== null && typeof obj === "object") {
      delete obj.id;
      for (let key in obj) {
        redactIds(obj[key]);
      }
    }
  }

  redactIds(userData);

  return { response: userData, status: 200 };
}
