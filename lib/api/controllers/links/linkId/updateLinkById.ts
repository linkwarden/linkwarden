import { prisma } from "@/lib/api/db";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import { moveFiles, removeFiles } from "@/lib/api/manageLinkFiles";
import isValidUrl from "@/lib/shared/isValidUrl";
import {
  UpdateLinkSchema,
  UpdateLinkSchemaType,
} from "@/lib/shared/schemaValidation";

export default async function updateLinkById(
  userId: number,
  linkId: number,
  body: UpdateLinkSchemaType
) {
  const dataValidation = UpdateLinkSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const data = dataValidation.data;

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const isCollectionOwner =
    collectionIsAccessible?.ownerId === data.collection.ownerId &&
    data.collection.ownerId === userId;

  const canPinPermission = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId
  );

  // If the user is part of a collection, they can pin it to their dashboard
  if (canPinPermission && data.pinnedBy && data.pinnedBy[0]) {
    const updatedLink = await prisma.link.update({
      where: {
        id: linkId,
      },
      data: {
        pinnedBy: data?.pinnedBy
          ? data.pinnedBy[0]?.id === userId
            ? { connect: { id: userId } }
            : { disconnect: { id: userId } }
          : undefined,
      },
      include: {
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

  const targetCollectionIsAccessible = await getPermission({
    userId,
    collectionId: data.collection.id,
  });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  const targetCollectionMatchesData = data.collection.id
    ? data.collection.id === targetCollectionIsAccessible?.id
    : true && data.collection.ownerId
      ? data.collection.ownerId === targetCollectionIsAccessible?.ownerId
      : true;

  if (!targetCollectionMatchesData)
    return {
      response: "Target collection does not match the data.",
      status: 401,
    };

  const unauthorizedSwitchCollection =
    !isCollectionOwner && collectionIsAccessible?.id !== data.collection.id;

  // Makes sure collection members (non-owners) cannot move a link to/from a collection.
  if (unauthorizedSwitchCollection)
    return {
      response: "You can't move a link to/from a collection you don't own.",
      status: 401,
    };
  else if (collectionIsAccessible?.ownerId !== userId && !memberHasAccess)
    return {
      response: "Collection is not accessible.",
      status: 401,
    };
  else {
    const oldLink = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
    });

    if (
      data.url &&
      oldLink &&
      oldLink?.url !== data.url &&
      isValidUrl(data.url)
    ) {
      await removeFiles(oldLink.id, oldLink.collectionId);
    } else if (oldLink?.url !== data.url)
      return {
        response: "Invalid URL.",
        status: 401,
      };

    const updatedLink = await prisma.link.update({
      where: {
        id: linkId,
      },
      data: {
        name: data.name || "",
        url: data.url,
        description: data.description || "",
        icon: data.icon,
        iconWeight: data.iconWeight,
        color: data.color,
        image: oldLink?.url !== data.url ? null : undefined,
        pdf: oldLink?.url !== data.url ? null : undefined,
        readable: oldLink?.url !== data.url ? null : undefined,
        monolith: oldLink?.url !== data.url ? null : undefined,
        preview: oldLink?.url !== data.url ? null : undefined,
        collection: {
          connect: {
            id: data.collection.id,
          },
        },
        tags: {
          set: [],
          connectOrCreate: data.tags.map((tag) => ({
            where: {
              name_ownerId: {
                name: tag.name,
                ownerId: data.collection.ownerId,
              },
            },
            create: {
              name: tag.name,
              owner: {
                connect: {
                  id: data.collection.ownerId,
                },
              },
            },
          })),
        },
        pinnedBy: data?.pinnedBy
          ? data.pinnedBy[0]?.id === userId
            ? { connect: { id: userId } }
            : { disconnect: { id: userId } }
          : undefined,
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

    if (collectionIsAccessible?.id !== data.collection.id) {
      await moveFiles(linkId, collectionIsAccessible?.id, data.collection.id);
    }

    return { response: updatedLink, status: 200 };
  }
}
