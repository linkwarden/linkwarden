import { prisma } from "@/lib/api/db";

export default async function getCollectionById(
  userId: number,
  collectionId: number
) {
  const collections = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      OR: [
        { ownerId: userId },
        { members: { some: { user: { id: userId } } } },
      ],
    },
    include: {
      _count: {
        select: { links: true },
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
