import { prisma } from "@/lib/api/db";
export default async function getLink(userId: number) {
  const links = await prisma.link.findMany({
    where: {
      collection: {
        OR: [
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    },
    include: {
      tags: true,
      collection: true,
    },
  });

  return { response: links, status: 200 };
}
