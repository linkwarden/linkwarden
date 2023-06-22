import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@prisma/client";
import fs from "fs";

export default async function deleteCollection(
  collection: { id: number },
  userId: number
) {
  const collectionId = collection.id;

  if (!collectionId)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, collectionId);

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

    try {
      fs.rmdirSync(`data/archives/${collectionId}`, { recursive: true });
    } catch (error) {
      console.log(
        "Collection's archive directory wasn't deleted most likely because it didn't exist..."
      );
    }

    return await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    });
  });

  return { response: deletedCollection, status: 200 };
}
