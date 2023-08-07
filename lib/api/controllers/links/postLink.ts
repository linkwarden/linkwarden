import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import getTitle from "@/lib/api/getTitle";
import archive from "@/lib/api/archive";
import { Collection, Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import createFolder from "@/lib/api/storage/createFolder";

export default async function postLink(
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) {
  try {
    new URL(link.url);
  } catch (error) {
    return {
      response:
        "Please enter a valid Address for the Link. (It should start with http/https)",
      status: 400,
    };
  }

  // This has to move above we assign link.collection.name
  // Because if the link is null (write then delete text on collection)
  // It will try to do trim on empty string and will throw and error, this prevents it.
  if (!link.collection.name) {
    link.collection.name = "Unnamed Collection";
  }

  link.collection.name = link.collection.name.trim();

  if (link.collection.id) {
    const collectionIsAccessible = (await getPermission(
      userId,
      link.collection.id
    )) as
      | (Collection & {
          members: UsersAndCollections[];
        })
      | null;

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
      return { response: "Collection is not accessible.", status: 401 };
  } else {
    link.collection.ownerId = userId;
  }

  const description =
    link.description && link.description !== ""
      ? link.description
      : await getTitle(link.url);

  const newLink: Link = await prisma.link.create({
    data: {
      url: link.url,
      name: link.name,
      description,
      collection: {
        connectOrCreate: {
          where: {
            name_ownerId: {
              ownerId: link.collection.ownerId,
              name: link.collection.name,
            },
          },
          create: {
            name: link.collection.name.trim(),
            ownerId: userId,
          },
        },
      },
      tags: {
        connectOrCreate: link.tags.map((tag) => ({
          where: {
            name_ownerId: {
              name: tag.name.trim(),
              ownerId: link.collection.ownerId,
            },
          },
          create: {
            name: tag.name.trim(),
            owner: {
              connect: {
                id: link.collection.ownerId,
              },
            },
          },
        })),
      },
    },
    include: { tags: true, collection: true },
  });

  createFolder({ filePath: `archives/${newLink.collectionId}` });

  archive(newLink.id, newLink.url);

  return { response: newLink, status: 200 };
}
