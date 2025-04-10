import { prisma } from "@/lib/api/db";

export default async function getCollection(userId: number) {
  const collections = await prisma.collection.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { user: { id: userId } } } },
      ],
    },
    include: {
      _count: {
        select: { links: true },
      },
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              username: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return { response: collections, status: 200 };
}
