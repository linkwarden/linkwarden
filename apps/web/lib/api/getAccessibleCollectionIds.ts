import { prisma } from "@linkwarden/prisma";

/**
 * Resolves the collections a user can access (owned + shared with them).
 *
 * Link queries should filter on `collectionId: { in: accessibleCollectionIds }`
 * instead of the nested `collection: { OR: [{ ownerId }, { members: ... }] }`
 * relation filter. Both produce the exact same result set, but the id list
 * hits the existing `Link.collectionId` index instead of running a correlated
 * subquery per link.
 *
 * ownedCollectionIds: Collections the user owns
 * memberCollectionIds: Collections the user is a member of
 * accessibleCollectionIds: Collections the user is either part of or a member of
 */
export default async function getAccessibleCollectionIds(userId: number) {
  const [ownedCollections, memberships] = await Promise.all([
    prisma.collection.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
    prisma.usersAndCollections.findMany({
      where: { userId },
      select: { collectionId: true },
    }),
  ]);

  const ownedCollectionIds = ownedCollections.map((c) => c.id);
  const memberCollectionIds = memberships.map((m) => m.collectionId);

  return {
    ownedCollectionIds,
    memberCollectionIds,
    accessibleCollectionIds: Array.from(
      new Set([...ownedCollectionIds, ...memberCollectionIds])
    ),
  };
}
