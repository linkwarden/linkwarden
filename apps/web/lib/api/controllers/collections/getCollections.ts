import { prisma } from "@linkwarden/prisma";

export default async function getCollection(userId: number) {
  const [user, collections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { collectionOrder: true },
    }),
    prisma.collection.findMany({
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
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
    }),
  ]);

  const orderIndex = new Map<number, number>(
    (user?.collectionOrder ?? []).map((id, index) => [Number(id), index])
  );

  collections.sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);
    const aIndex = orderIndex.get(aId);
    const bIndex = orderIndex.get(bId);

    if (typeof aIndex === "number" && typeof bIndex === "number") {
      return aIndex - bIndex;
    }

    if (typeof aIndex === "number") return -1;
    if (typeof bIndex === "number") return 1;

    const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (createdAtDiff !== 0) return createdAtDiff;

    return aId - bId;
  });

  return { response: collections, status: 200 };
}
