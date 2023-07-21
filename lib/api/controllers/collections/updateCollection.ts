import { prisma } from "@/lib/api/db";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import getPermission from "@/lib/api/getPermission";
import { Collection, UsersAndCollections } from "@prisma/client";

export default async function updateCollection(
  collection: CollectionIncludingMembersAndLinkCount,
  userId: number
) {
  if (!collection.id)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = (await getPermission(
    userId,
    collection.id
  )) as
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
          id: collection.id,
        },
      },
    });

    return await prisma.collection.update({
      where: {
        id: collection.id,
      },

      data: {
        name: collection.name,
        description: collection.description,
        color: collection.color,
        isPublic: collection.isPublic,
        members: {
          create: collection.members.map((e) => ({
            user: { connect: { id: e.user.id } },
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
