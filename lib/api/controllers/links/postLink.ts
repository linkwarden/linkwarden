import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import fetchTitleAndHeaders from "@/lib/shared/fetchTitleAndHeaders";
import createFolder from "@/lib/api/storage/createFolder";
import setLinkCollection from "../../setLinkCollection";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

export default async function postLink(
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) {
  if (link.url || link.type === "url") {
    try {
      new URL(link.url || "");
    } catch (error) {
      return {
        response:
          "Please enter a valid Address for the Link. (It should start with http/https)",
        status: 400,
      };
    }
  }

  const linkCollection = await setLinkCollection(link, userId);

  if (!linkCollection)
    return { response: "Collection is not accessible.", status: 400 };

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user?.preventDuplicateLinks) {
    const url = link.url?.trim().replace(/\/+$/, ""); // trim and remove trailing slashes from the URL
    const hasWwwPrefix = url?.includes(`://www.`);
    const urlWithoutWww = hasWwwPrefix ? url?.replace(`://www.`, "://") : url;
    const urlWithWww = hasWwwPrefix ? url : url?.replace("://", `://www.`);

    const existingLink = await prisma.link.findFirst({
      where: {
        OR: [{ url: urlWithWww }, { url: urlWithoutWww }],
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
        ownerId: linkCollection.ownerId,
      },
    },
  });

  if (numberOfLinksTheUserHas > MAX_LINKS_PER_USER)
    return {
      response: `Each collection owner can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      status: 400,
    };

  const { title, headers } = await fetchTitleAndHeaders(link.url || "");

  const name =
    link.name && link.name !== "" ? link.name : link.url ? title : "";

  const contentType = headers?.get("content-type");
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
      url: link.url?.trim().replace(/\/+$/, "") || null,
      name,
      description: link.description,
      type: linkType,
      collection: {
        connect: {
          id: linkCollection.id,
        },
      },
      tags: {
        connectOrCreate: link.tags.map((tag) => ({
          where: {
            name_ownerId: {
              name: tag.name.trim(),
              ownerId: linkCollection.ownerId,
            },
          },
          create: {
            name: tag.name.trim(),
            owner: {
              connect: {
                id: linkCollection.ownerId,
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
