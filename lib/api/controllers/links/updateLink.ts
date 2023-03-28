import { prisma } from "@/lib/api/db";
import { ExtendedLink } from "@/types/global";
import { Link, UsersAndCollections } from "@prisma/client";
import hasAccessToCollection from "@/lib/api/hasAccessToCollection";

export default async function (link: ExtendedLink, userId: number) {
  if (!link) return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = await hasAccessToCollection(
    userId,
    link.collectionId
  );

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
    return { response: "Collection is not accessible.", status: 401 };

  const updatedLink: Link = await prisma.link.update({
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
    },
  });

  return { response: updatedLink, status: 200 };
}
