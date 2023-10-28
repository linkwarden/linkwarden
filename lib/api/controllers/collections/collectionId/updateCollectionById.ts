import { prisma } from "@/lib/api/db";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import getPermission from "@/lib/api/getPermission";
import { Collection, UsersAndCollections } from "@prisma/client";

export default async function updateCollection(
  userId: number,
  collectionId: number,
  data: CollectionIncludingMembersAndLinkCount
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

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

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
