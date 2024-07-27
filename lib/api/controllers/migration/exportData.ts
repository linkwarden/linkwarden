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

  function redactIds(data: object | object[]): void {
    if (Array.isArray(data)) {
      data.forEach((item) => redactIds(item));
    } else if (data !== null && typeof data === "object") {
      const fieldsToRedact = ["id", "parentId", "collectionId", "ownerId"];

      fieldsToRedact.forEach((field) => {
        if (field in data) {
          delete (data as any)[field];
        }
      });

      // Recursively call redactIds for each property that is an object or an array
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (
          value !== null &&
          (typeof value === "object" || Array.isArray(value))
        ) {
          redactIds(value);
        }
      });
    }
  }

  redactIds(userData);

  return { response: userData, status: 200 };
}
