import { prisma } from "@linkwarden/prisma";

export default async function getCollection(userId: number) {
  const [user, collectionsWithoutCount] = await Promise.all([
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
    }),
  ]);

  const linkCounts =
    collectionsWithoutCount.length > 0
      ? await prisma.link.groupBy({
          by: ["collectionId"],
          where: {
            collectionId: { in: collectionsWithoutCount.map((c) => c.id) },
          },
          _count: { _all: true },
        })
      : [];

  const linkCountByCollectionId = new Map(
    linkCounts.map((row) => [row.collectionId, row._count._all])
  );

  const collections = collectionsWithoutCount.map((collection) => ({
    ...collection,
    _count: { links: linkCountByCollectionId.get(collection.id) ?? 0 },
  }));

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
