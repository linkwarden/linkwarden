import { prisma } from "@linkwarden/prisma";
import getPermission from "@/lib/api/getPermission";
import getCollectionAncestorIds from "@/lib/api/getCollectionAncestorIds";
import {
  UpdateCollectionSchema,
  UpdateCollectionSchemaType,
} from "@linkwarden/lib/schemaValidation";

export default async function updateCollection(
  userId: number,
  collectionId: number,
  body: UpdateCollectionSchemaType
) {
  // Prisma drops the fraction from an id, so 12.5 would update collection 12
  // while the cycle check below still compares it as 12.5
  if (!collectionId || !Number.isInteger(collectionId))
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
        },
      });

      if (
        findParentCollection?.ownerId !== userId ||
        typeof data.parentId !== "number"
      )
        return {
          response: "You are not authorized to create a sub-collection here.",
          status: 403,
        };

      // A move under this collection or one of its sub-collections would put it
      // inside itself, and every walk up the tree would loop forever. Edits send
      // the parent the collection already has, which isn't a move, so they skip
      // this and still work on a collection saved in a cycle before.
      if (
        data.parentId !== collectionIsAccessible.parentId &&
        (await getCollectionAncestorIds(data.parentId)).has(collectionId)
      )
        return {
          response:
            "A collection can't be moved into itself or one of its sub-collections.",
          status: 400,
        };
    }
  }

  const uniqueMembers = data.members.filter(
    (e, i, a) =>
      a.findIndex((el) => el.userId === e.userId) === i &&
      e.userId !== collectionIsAccessible.ownerId
  );

  const updatedCollection = await prisma.$transaction(async () => {
    if (data.propagateToSubcollections) {
      const getAllSubCollections = async (
        parentId: number
      ): Promise<{ id: number; ownerId: number }[]> => {
        const result: { id: number; ownerId: number }[] = [];

        let frontier: number[] = [parentId];

        const seen = new Set<number>(frontier);

        while (frontier.length > 0) {
          const children = await prisma.collection.findMany({
            where: { parentId: { in: frontier } },
            select: { id: true, ownerId: true },
          });

          // Only unseen children go on, or a parent cycle would loop here forever
          frontier = [];

          for (const child of children) {
            if (seen.has(child.id)) continue;
            seen.add(child.id);
            result.push(child);
            frontier.push(child.id);
          }
        }

        return result;
      };

      const subCollections = await getAllSubCollections(collectionId);

      for (const sub of subCollections) {
        await prisma.usersAndCollections.deleteMany({
          where: { collectionId: sub.id },
        });

        const subMembers = uniqueMembers.filter(
          (m) => m.userId !== sub.ownerId
        );

        if (subMembers.length > 0) {
          await prisma.usersAndCollections.createMany({
            data: subMembers.map((e) => ({
              userId: e.userId,
              collectionId: sub.id,
              canCreate: e.canCreate,
              canUpdate: e.canUpdate,
              canDelete: e.canDelete,
            })),
          });
        }
      }
    }

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
        links: {
          select: {
            id: true,
          },
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

  const { links, ...dataResponse } = updatedCollection;

  const linkIds = links.map((link) => link.id);

  await prisma.link.updateMany({
    where: {
      id: {
        in: linkIds,
      },
    },
    data: {
      indexVersion: null,
    },
  });

  return { response: dataResponse, status: 200 };
}
