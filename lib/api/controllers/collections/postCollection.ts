import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import {
  PostCollectionSchema,
  PostCollectionSchemaType,
} from "@/lib/shared/schemaValidation";

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

  if (collection.parentId) {
    const findParentCollection = await prisma.collection.findUnique({
      where: {
        id: collection.parentId,
      },
      select: {
        ownerId: true,
      },
    });

    if (
      findParentCollection?.ownerId !== userId ||
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

  return { response: newCollection, status: 200 };
}
