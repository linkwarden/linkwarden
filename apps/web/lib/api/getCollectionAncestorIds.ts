import { prisma } from "@linkwarden/prisma";

// The collection's own id and the ids of every collection above it. Stops at a
// collection already visited, so a parent cycle can't loop forever.
export default async function getCollectionAncestorIds(collectionId: number) {
  const ancestorIds = new Set<number>();

  let currentId: number | null = collectionId;

  while (currentId && !ancestorIds.has(currentId)) {
    ancestorIds.add(currentId);

    const collection: { parentId: number | null } | null =
      await prisma.collection.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

    currentId = collection?.parentId ?? null;
  }

  return ancestorIds;
}
