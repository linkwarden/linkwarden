import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function getLinkById(userId: number, linkId: number) {
  if (!linkId)
    return {
      response: "Please choose a valid link.",
      status: 401,
    };

  const collectionIsAccessible = await getPermission({ userId, linkId });

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
    const link = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: {
          where: { id: userId },
          select: { id: true },
        },
      },
    });

    // strip out the other users from pinnedBy
    if (link?.pinnedBy && link.pinnedBy.length > 0) {
      link.pinnedBy = link.pinnedBy.filter((p) => p.id === userId);
    }

    return { response: link, status: 200 };
  }
}
