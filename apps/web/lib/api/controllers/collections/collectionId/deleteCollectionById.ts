import { prisma } from "@linkwarden/prisma";
import getPermission from "@/lib/api/getPermission";
import getCollectionAncestorIds from "@/lib/api/getCollectionAncestorIds";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import { removeFolder } from "@linkwarden/filesystem";
import { meiliClient } from "@linkwarden/lib/meilisearchClient";

export default async function deleteCollection(
  userId: number,
  collectionId: number
) {
  // Prisma drops the fraction from an id, so 12.5 would delete collection 12
  // while the cycle check below still compares it as 12.5
  if (!collectionId || !Number.isInteger(collectionId))
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission({
    userId,
    collectionId,
  });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId
  );

  if (collectionIsAccessible?.ownerId !== userId && memberHasAccess) {
    // Remove relation/Leave collection
    const deletedUsersAndCollectionsRelation =
      await prisma.usersAndCollections.delete({
        where: {
          userId_collectionId: {
            userId: userId,
            collectionId: collectionId,
          },
        },
      });

    await Promise.all([
      removeFromOrders(userId, collectionId),
      updateDashboardSectionLayout(userId, collectionId),
    ]);

    await prisma.link.updateMany({
      where: {
        collectionId,
      },
      data: {
        indexVersion: null,
      },
    });

    return { response: deletedUsersAndCollectionsRelation, status: 200 };
  } else if (collectionIsAccessible?.ownerId !== userId) {
    return { response: "Collection is not accessible.", status: 401 };
  }

  // If the collection is inside its own subtree (a parent cycle), deleting a
  // subcollection would cascade to it before the steps below, so it's detached
  // first. Only then, since these steps don't roll back, and a delete that fails
  // partway should leave any other collection under its parent.
  const isInParentCycle =
    collectionIsAccessible.parentId !== null &&
    (await getCollectionAncestorIds(collectionIsAccessible.parentId)).has(
      collectionId
    );

  const deletedCollection = await prisma.$transaction(async () => {
    if (isInParentCycle)
      await prisma.collection.update({
        where: { id: collectionId },
        data: { parentId: null },
      });

    await deleteSubCollections(collectionId);

    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collectionId,
        },
      },
    });

    await removeFolder({ filePath: `archives/${collectionId}` });
    await removeFolder({ filePath: `archives/preview/${collectionId}` });

    await Promise.all([
      removeFromOrders(userId, collectionId),
      updateDashboardSectionLayout(userId, collectionId),
    ]);

    const links = await prisma.link.findMany({
      where: {
        collectionId: collectionId,
      },
      select: {
        id: true,
      },
    });

    const linkIds = links.map((link) => link.id);

    await meiliClient?.index("links").deleteDocuments(linkIds);

    await prisma.link.deleteMany({
      where: {
        collection: {
          id: collectionId,
        },
      },
    });

    const collection = await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    });

    return collection;
  });

  return { response: deletedCollection, status: 200 };
}

async function deleteSubCollections(
  collectionId: number,
  visited = new Set<number>([collectionId])
) {
  const subCollections = await prisma.collection.findMany({
    where: { parentId: collectionId },
  });

  for (const subCollection of subCollections) {
    // A parent cycle would otherwise recurse forever
    if (visited.has(subCollection.id)) continue;
    visited.add(subCollection.id);

    await deleteSubCollections(subCollection.id, visited);

    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: subCollection.id,
        },
      },
    });

    const links = await prisma.link.findMany({
      where: {
        collectionId: subCollection.id,
      },
      select: {
        id: true,
      },
    });

    const linkIds = links.map((link) => link.id);

    await meiliClient?.index("links").deleteDocuments(linkIds);

    await prisma.link.deleteMany({
      where: {
        collection: {
          id: subCollection.id,
        },
      },
    });

    await prisma.collection.delete({
      where: { id: subCollection.id },
    });

    await removeFolder({ filePath: `archives/${subCollection.id}` });
    await removeFolder({ filePath: `archives/preview/${subCollection.id}` });
  }
}

async function removeFromOrders(userId: number, collectionId: number) {
  const userCollectionOrder = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      collectionOrder: true,
    },
  });

  if (userCollectionOrder)
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        collectionOrder: {
          set: userCollectionOrder.collectionOrder.filter(
            (e: number) => e !== collectionId
          ),
        },
      },
    });
}

async function updateDashboardSectionLayout(
  userId: number,
  collectionId: number
) {
  const dashboardSection = await prisma.dashboardSection.findFirst({
    where: {
      userId,
      collectionId,
    },
  });

  if (dashboardSection) {
    const sectionOrder = dashboardSection.order;

    await prisma.$transaction(async (tx) => {
      await tx.dashboardSection.delete({
        where: {
          id: dashboardSection.id,
        },
      });

      await tx.dashboardSection.updateMany({
        where: {
          userId,
          order: {
            gt: sectionOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    });
  }
}
