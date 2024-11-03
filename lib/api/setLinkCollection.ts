import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { prisma } from "./db";
import getPermission from "./getPermission";
import { UsersAndCollections } from "@prisma/client";

const setLinkCollection = async (
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) => {
  if (link?.collection?.id && typeof link?.collection?.id === "number") {
    const existingCollection = await prisma.collection.findUnique({
      where: {
        id: link.collection.id,
      },
    });

    if (!existingCollection) return null;

    const collectionIsAccessible = await getPermission({
      userId,
      collectionId: existingCollection.id,
    });

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
      return null;

    return existingCollection;
  } else if (link?.collection?.name) {
    if (link.collection.name === "Unorganized") {
      const firstTopLevelUnorganizedCollection =
        await prisma.collection.findFirst({
          where: {
            name: "Unorganized",
            ownerId: userId,
            parentId: null,
          },
        });

      if (firstTopLevelUnorganizedCollection)
        return firstTopLevelUnorganizedCollection;
    }

    const newCollection = await prisma.collection.create({
      data: {
        name: link.collection.name.trim(),
        ownerId: userId,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        collectionOrder: {
          push: newCollection.id,
        },
      },
    });

    return newCollection;
  } else {
    const firstTopLevelUnorganizedCollection =
      await prisma.collection.findFirst({
        where: {
          name: "Unorganized",
          ownerId: userId,
          parentId: null,
        },
      });

    if (firstTopLevelUnorganizedCollection)
      return firstTopLevelUnorganizedCollection;
    else
      return await prisma.collection.create({
        data: {
          name: "Unorganized",
          ownerId: userId,
          parentId: null,
        },
      });
  }
};

export default setLinkCollection;
