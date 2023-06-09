import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import fs from "fs";

export default async function deleteCollection(
  collection: { id: number },
  userId: number
) {
  if (!collection.id)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, collection.id);

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

  const deletedCollection = await prisma.$transaction(async () => {
    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collection.id,
        },
      },
    });

    await prisma.link.deleteMany({
      where: {
        collection: {
          id: collection.id,
        },
      },
    });

    try {
      fs.rmdirSync(`data/archives/${collection.id}`, { recursive: true });
    } catch (error) {
      console.log(
        "Collection's archive directory wasn't deleted most likely because it didn't exist..."
      );
    }

    return await prisma.collection.delete({
      where: {
        id: collection.id,
      },
    });
  });

  return { response: deletedCollection, status: 200 };
}
