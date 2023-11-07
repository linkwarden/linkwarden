import { prisma } from "@/lib/api/db";
import { Collection, Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function getLinkById(userId: number, linkId: number) {
  if (!linkId)
    return {
      response: "Please choose a valid link.",
      status: 401,
    };

  const collectionIsAccessible = (await getPermission({ userId, linkId })) as
    | (Collection & {
        members: UsersAndCollections[];
      })
    | null;

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId
  );

  const isCollectionOwner = collectionIsAccessible?.ownerId === userId;

  if (collectionIsAccessible?.ownerId !== userId && !memberHasAccess)
    return {
      response: "Collection is not accessible.",
      status: 401,
    };
  else {
    const updatedLink = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: isCollectionOwner
          ? {
              where: { id: userId },
              select: { id: true },
            }
          : undefined,
      },
    });

    return { response: updatedLink, status: 200 };
  }
}
