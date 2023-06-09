import { prisma } from "@/lib/api/db";
import { CollectionIncludingMembers } from "@/types/global";
import getPermission from "@/lib/api/getPermission";

export default async function updateCollection(
  collection: CollectionIncludingMembers,
  userId: number
) {
  if (!collection.id)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, collection.id);

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
            user: { connect: { email: e.user.email } },
            canCreate: e.canCreate,
            canUpdate: e.canUpdate,
            canDelete: e.canDelete,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                email: true,
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
