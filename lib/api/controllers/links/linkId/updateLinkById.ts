import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Collection, Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import moveFile from "@/lib/api/storage/moveFile";

export default async function updateLinkById(
  userId: number,
  linkId: number,
  data: LinkIncludingShortenedCollectionAndTags
) {
  if (!data || !data.collection.id)
    return {
      response: "Please choose a valid link and collection.",
      status: 401,
    };

  const collectionIsAccessible = (await getPermission({ userId, linkId })) as
    | (Collection & {
        members: UsersAndCollections[];
      })
    | null;

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  const isCollectionOwner =
    collectionIsAccessible?.ownerId === data.collection.ownerId &&
    data.collection.ownerId === userId;

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
    const updatedLink = await prisma.link.update({
      where: {
        id: linkId,
      },
      data: {
        name: data.name,
        description: data.description,
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
        pinnedBy:
          data?.pinnedBy && data.pinnedBy[0]
            ? { connect: { id: userId } }
            : { disconnect: { id: userId } },
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
      await moveFile(
        `archives/${collectionIsAccessible?.id}/${linkId}.pdf`,
        `archives/${data.collection.id}/${linkId}.pdf`
      );

      await moveFile(
        `archives/${collectionIsAccessible?.id}/${linkId}.png`,
        `archives/${data.collection.id}/${linkId}.png`
      );

      await moveFile(
        `archives/${collectionIsAccessible?.id}/${linkId}_readability.json`,
        `archives/${data.collection.id}/${linkId}_readability.json`
      );
    }

    return { response: updatedLink, status: 200 };
  }
}
