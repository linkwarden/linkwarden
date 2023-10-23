import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import { Collection, UsersAndCollections } from "@prisma/client";
import removeFolder from "@/lib/api/storage/removeFolder";

export default async function deleteCollection(
  userId: number,
  collectionId: number
) {
  if (!collectionId)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = (await getPermission({
    userId,
    collectionId,
  })) as
    | (Collection & {
        members: UsersAndCollections[];
      })
    | null;

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

    return { response: deletedUsersAndCollectionsRelation, status: 200 };
  } else if (collectionIsAccessible?.ownerId !== userId) {
    return { response: "Collection is not accessible.", status: 401 };
  }

  const deletedCollection = await prisma.$transaction(async () => {
    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collectionId,
        },
      },
    });

    await prisma.link.deleteMany({
      where: {
        collection: {
          id: collectionId,
        },
      },
    });

    removeFolder({ filePath: `archives/${collectionId}` });

    return await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    });
  });

  return { response: deletedCollection, status: 200 };
}
