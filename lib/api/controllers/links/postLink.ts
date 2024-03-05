import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import getTitle from "@/lib/shared/getTitle";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import createFolder from "@/lib/api/storage/createFolder";
import validateUrlSize from "../../validateUrlSize";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

export default async function postLink(
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) {
  try {
    new URL(link.url || "");
  } catch (error) {
    return {
      response:
        "Please enter a valid Address for the Link. (It should start with http/https)",
      status: 400,
    };
  }

  if (!link.collection.id && link.collection.name) {
    link.collection.name = link.collection.name.trim();

    // find the collection with the name and the user's id
    const findCollection = await prisma.collection.findFirst({
      where: {
        name: link.collection.name,
        ownerId: userId,
        parentId: link.collection.parentId,
      },
    });

    if (findCollection) {
      const collectionIsAccessible = await getPermission({
        userId,
        collectionId: findCollection.id,
      });

      const memberHasAccess = collectionIsAccessible?.members.some(
        (e: UsersAndCollections) => e.userId === userId && e.canCreate
      );

      if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
        return { response: "Collection is not accessible.", status: 401 };

      link.collection.id = findCollection.id;
    } else {
      const collection = await prisma.collection.create({
        data: {
          name: link.collection.name,
          ownerId: userId,
        },
      });

      link.collection.id = collection.id;

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          collectionOrder: {
            push: link.collection.id,
          },
        },
      });
    }
  } else if (link.collection.id) {
    const collectionIsAccessible = await getPermission({
      userId,
      collectionId: link.collection.id,
    });

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
      return { response: "Collection is not accessible.", status: 401 };
  } else if (!link.collection.id) {
    link.collection.name = "Unorganized";
    link.collection.parentId = null;

    // find the collection with the name "Unorganized" and the user's id
    const unorganizedCollection = await prisma.collection.findFirst({
      where: {
        name: "Unorganized",
        ownerId: userId,
      },
    });

    link.collection.id = unorganizedCollection?.id;

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        collectionOrder: {
          push: link.collection.id,
        },
      },
    });
  } else {
    return { response: "Uncaught error.", status: 500 };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user?.preventDuplicateLinks) {
    const existingLink = await prisma.link.findFirst({
      where: {
        url: link.url?.trim(),
        collection: {
          ownerId: userId,
        },
      },
    });

    if (existingLink)
      return {
        response: "Link already exists",
        status: 409,
      };
  }

  const numberOfLinksTheUserHas = await prisma.link.count({
    where: {
      collection: {
        ownerId: userId,
      },
    },
  });

  if (numberOfLinksTheUserHas + 1 > MAX_LINKS_PER_USER)
    return {
      response: `Error: Each user can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      status: 400,
    };

  link.collection.name = link.collection.name.trim();

  const description =
    link.description && link.description !== ""
      ? link.description
      : link.url
        ? await getTitle(link.url)
        : undefined;

  const validatedUrl = link.url ? await validateUrlSize(link.url) : undefined;

  const contentType = validatedUrl?.get("content-type");
  let linkType = "url";
  let imageExtension = "png";

  if (!link.url) linkType = link.type;
  else if (contentType === "application/pdf") linkType = "pdf";
  else if (contentType?.startsWith("image")) {
    linkType = "image";
    if (contentType === "image/jpeg") imageExtension = "jpeg";
    else if (contentType === "image/png") imageExtension = "png";
  }

  const newLink = await prisma.link.create({
    data: {
      url: link.url?.trim(),
      name: link.name,
      description,
      type: linkType,
      collection: {
        connect: {
          id: link.collection.id,
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

  return { response: newLink, status: 200 };
}
