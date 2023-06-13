import { prisma } from "@/lib/api/db";
import { LinkIncludingCollectionAndTags } from "@/types/global";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function updateLink(
  link: LinkIncludingCollectionAndTags,
  userId: number
) {
  if (!link) return { response: "Please choose a valid link.", status: 401 };

  if (link.collection.id) {
    const collectionIsAccessible = await getPermission(
      userId,
      link.collection.id
    );

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
      return { response: "Collection is not accessible.", status: 401 };
  } else {
    link.collection.ownerId = userId;
  }

  const updatedLink = await prisma.link.update({
    where: {
      id: link.id,
    },
    data: {
      name: link.name,
      collection: {
        connectOrCreate: {
          where: {
            name_ownerId: {
              ownerId: link.collection.ownerId,
              name: link.collection.name,
            },
          },
          create: {
            name: link.collection.name,
            ownerId: userId,
          },
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
      pinnedBy: {
        where: { id: userId },
        select: { id: true },
      },
    },
  });

  return { response: updatedLink, status: 200 };
}
