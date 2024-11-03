import { prisma } from "@/lib/api/db";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import getPermission from "@/lib/api/getPermission";

export default async function updateCollection(
  userId: number,
  collectionId: number,
  data: CollectionIncludingMembersAndLinkCount
) {
  if (!collectionId)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission({
    userId,
    collectionId,
  });

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

  console.log(data);

  if (data.parentId) {
    if (data.parentId !== ("root" as any)) {
      const findParentCollection = await prisma.collection.findUnique({
        where: {
          id: data.parentId,
        },
        select: {
          ownerId: true,
          parentId: true,
        },
      });

      if (
        findParentCollection?.ownerId !== userId ||
        typeof data.parentId !== "number" ||
        findParentCollection?.parentId === data.parentId
      )
        return {
          response: "You are not authorized to create a sub-collection here.",
          status: 403,
        };
    }
  }

  const updatedCollection = await prisma.$transaction(async () => {
    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collectionId,
        },
      },
    });

    return await prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        name: data.name.trim(),
        description: data.description,
        color: data.color,
        isPublic: data.isPublic,
        parent:
          data.parentId && data.parentId !== ("root" as any)
            ? {
                connect: {
                  id: data.parentId,
                },
              }
            : data.parentId === ("root" as any)
              ? {
                  disconnect: true,
                }
              : undefined,
        members: {
          create: data.members.map((e) => ({
            user: { connect: { id: e.user.id || e.userId } },
            canCreate: e.canCreate,
            canUpdate: e.canUpdate,
            canDelete: e.canDelete,
          })),
        },
      },
      include: {
        _count: {
          select: { links: true },
        },
        members: {
          include: {
            user: {
              select: {
                image: true,
                username: true,
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });
  });

  return { response: updatedCollection, status: 200 };
}
