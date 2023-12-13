import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import getTitle from "@/lib/shared/getTitle";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import createFolder from "@/lib/api/storage/createFolder";
import validateUrlSize from "../../validateUrlSize";

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

  if (!link.collection.name) {
    link.collection.name = "Unorganized";
  }

  link.collection.name = link.collection.name.trim();

  if (link.collection.id) {
    const collectionIsAccessible = await getPermission({
      userId,
      collectionId: link.collection.id,
    });

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
      : link.url
      ? await getTitle(link.url)
      : undefined;

  const validatedUrl = link.url ? await validateUrlSize(link.url) : undefined;

  if (validatedUrl === null)
    return { response: "File is too large to be stored.", status: 400 };

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
      url: link.url,
      name: link.name,
      description,
      type: linkType,
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

  return { response: newLink, status: 200 };
}
