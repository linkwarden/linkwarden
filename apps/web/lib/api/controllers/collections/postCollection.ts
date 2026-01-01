import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import {
  PostCollectionSchema,
  PostCollectionSchemaType,
} from "@linkwarden/lib/schemaValidation";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@linkwarden/prisma/client";

export default async function postCollection(
  body: PostCollectionSchemaType,
  userId: number
) {
  const dataValidation = PostCollectionSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const collection = dataValidation.data;

  let parentCollectionMembers: UsersAndCollections[] = [];

  if (collection.parentId) {
    const findParentCollection = await prisma.collection.findUnique({
      where: {
        id: collection.parentId,
      },
      select: {
        ownerId: true,
        members: true,
      },
    });

    if (findParentCollection) {
      parentCollectionMembers =
        findParentCollection.members as UsersAndCollections[];
    }
    const collectionIsAccessible = await getPermission({
      userId: userId,
      collectionId: collection.parentId,
    });
    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate && e.canUpdate && e.canDelete
    );


    if (
      (findParentCollection?.ownerId !== userId && !memberHasAccess) ||
      typeof collection.parentId !== "number"
    )
      return {
        response: "You are not authorized to create a sub-collection here.",
        status: 403,
      };
  }

  const newCollection = await prisma.collection.create({
    data: {
      name: collection.name.trim(),
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      iconWeight: collection.iconWeight,
      members: {
        create: parentCollectionMembers.map((member) => ({
          userId: member.userId,
          canCreate: member.canCreate,
          canUpdate: member.canUpdate,
          canDelete: member.canDelete,
        })),
      },
      parent: collection.parentId
        ? {
            connect: {
              id: collection.parentId,
            },
          }
        : undefined,
      owner: {
        connect: {
          id: userId,
        },
      },
      createdBy: {
        connect: {
          id: userId,
        },
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
            },
          },
        },
      },
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

  createFolder({ filePath: `archives/${newCollection.id}` });
  createFolder({ filePath: `archives/preview/${newCollection.id}` });

  return { response: newCollection, status: 200 };
}
