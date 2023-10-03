import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Collection, Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import moveFile from "@/lib/api/storage/moveFile";

export default async function updateLink(
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) {
  console.log(link);
  if (!link || !link.collection.id)
    return {
      response: "Please choose a valid link and collection.",
      status: 401,
    };

  const targetLink = (await getPermission(
    userId,
    link.collection.id,
    link.id
  )) as
    | (Link & {
        collection: Collection & {
          members: UsersAndCollections[];
        };
      })
    | null;

  const memberHasAccess = targetLink?.collection.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  const isCollectionOwner =
    targetLink?.collection.ownerId === link.collection.ownerId &&
    link.collection.ownerId === userId;

  const unauthorizedSwitchCollection =
    !isCollectionOwner && targetLink?.collection.id !== link.collection.id;

  console.log(isCollectionOwner);

  // Makes sure collection members (non-owners) cannot move a link to/from a collection.
  if (unauthorizedSwitchCollection)
    return {
      response: "You can't move a link to/from a collection you don't own.",
      status: 401,
    };
  else if (targetLink?.collection.ownerId !== userId && !memberHasAccess)
    return {
      response: "Collection is not accessible.",
      status: 401,
    };
  else {
    const updatedLink = await prisma.link.update({
      where: {
        id: link.id,
      },
      data: {
        name: link.name,
        description: link.description,
        collection: {
          connect: {
            id: link.collection.id,
          },
        },
        tags: {
          set: [],
          connectOrCreate: link.tags.map((tag) => ({
            where: {
              name_ownerId: {
                name: tag.name,
                ownerId: link.collection.ownerId,
              },
            },
            create: {
              name: tag.name,
              owner: {
                connect: {
                  id: link.collection.ownerId,
                },
              },
            },
          })),
        },
        pinnedBy:
          link?.pinnedBy && link.pinnedBy[0]
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

    if (targetLink?.collection.id !== link.collection.id) {
      await moveFile(
        `archives/${targetLink?.collection.id}/${link.id}.pdf`,
        `archives/${link.collection.id}/${link.id}.pdf`
      );

      await moveFile(
        `archives/${targetLink?.collection.id}/${link.id}.png`,
        `archives/${link.collection.id}/${link.id}.png`
      );
    }

    return { response: updatedLink, status: 200 };
  }
}
