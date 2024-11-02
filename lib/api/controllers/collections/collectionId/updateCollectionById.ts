import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import {
  UpdateCollectionSchema,
  UpdateCollectionSchemaType,
} from "@/lib/shared/schemaValidation";

export default async function updateCollection(
  userId: number,
  collectionId: number,
  body: UpdateCollectionSchemaType
) {
  if (!collectionId)
    return { response: "Please choose a valid collection.", status: 401 };

  const dataValidation = UpdateCollectionSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const data = dataValidation.data;

  const collectionIsAccessible = await getPermission({
    userId,
    collectionId,
  });

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

  if (data.parentId) {
    if (data.parentId !== "root") {
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

  const uniqueMembers = data.members.filter(
    (e, i, a) =>
      a.findIndex((el) => el.userId === e.userId) === i &&
      e.userId !== collectionIsAccessible.ownerId
  );

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
        icon: data.icon,
        iconWeight: data.iconWeight,
        isPublic: data.isPublic,
        parent:
          data.parentId && data.parentId !== "root"
            ? {
                connect: {
                  id: data.parentId,
                },
              }
            : data.parentId === "root"
              ? {
                  disconnect: true,
                }
              : undefined,
        members: {
          create: uniqueMembers.map((e) => ({
            user: { connect: { id: e.userId } },
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
