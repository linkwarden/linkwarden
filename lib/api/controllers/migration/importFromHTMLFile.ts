import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";
import { parse, Node, Element, TextNode } from "himalaya";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

export default async function importFromHTMLFile(
  userId: number,
  rawData: string
) {
  const dom = new JSDOM(rawData);
  const document = dom.window.document;

  // remove bad tags
  document.querySelectorAll("meta").forEach((e) => (e.outerHTML = e.innerHTML));
  document.querySelectorAll("META").forEach((e) => (e.outerHTML = e.innerHTML));
  document.querySelectorAll("P").forEach((e) => (e.outerHTML = e.innerHTML));

  const bookmarks = document.querySelectorAll("A");
  const totalImports = bookmarks.length;

  const numberOfLinksTheUserHas = await prisma.link.count({
    where: {
      collection: {
        ownerId: userId,
      },
    },
  });

  if (totalImports + numberOfLinksTheUserHas > MAX_LINKS_PER_USER)
    return {
      response: `Error: Each user can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      status: 400,
    };

  const jsonData = parse(document.documentElement.outerHTML);

  for (const item of jsonData) {
    console.log(item);
    await processBookmarks(userId, item as Element);
  }

  return { response: "Success.", status: 200 };
}

async function processBookmarks(
  userId: number,
  data: Node,
  parentCollectionId?: number
) {
  if (data.type === "element") {
    for (const item of data.children) {
      if (item.type === "element" && item.tagName === "dt") {
        // process collection or sub-collection

        let collectionId;
        const collectionName = item.children.find(
          (e) => e.type === "element" && e.tagName === "h3"
        ) as Element;

        if (collectionName) {
          collectionId = await createCollection(
            userId,
            (collectionName.children[0] as TextNode).content,
            parentCollectionId
          );
        }
        await processBookmarks(
          userId,
          item,
          collectionId || parentCollectionId
        );
      } else if (item.type === "element" && item.tagName === "a") {
        // process link

        const linkUrl = item?.attributes.find((e) => e.key === "href")?.value;
        const linkName = (
          item?.children.find((e) => e.type === "text") as TextNode
        )?.content;
        const linkTags = item?.attributes
          .find((e) => e.key === "tags")
          ?.value.split(",");

        if (linkUrl && parentCollectionId) {
          await createLink(
            userId,
            linkUrl,
            parentCollectionId,
            linkName,
            "",
            linkTags
          );
        } else if (linkUrl) {
          // create a collection named "Imported Bookmarks" and add the link to it
          const collectionId = await createCollection(userId, "Imports");

          await createLink(
            userId,
            linkUrl,
            collectionId,
            linkName,
            "",
            linkTags
          );
        }

        await processBookmarks(userId, item, parentCollectionId);
      } else {
        // process anything else
        await processBookmarks(userId, item, parentCollectionId);
      }
    }
  }
}

const createCollection = async (
  userId: number,
  collectionName: string,
  parentId?: number
) => {
  const findCollection = await prisma.collection.findFirst({
    where: {
      parentId,
      name: collectionName,
      ownerId: userId,
    },
  });

  if (findCollection) {
    return findCollection.id;
  }

  const collectionId = await prisma.collection.create({
    data: {
      name: collectionName,
      parent: parentId
        ? {
            connect: {
              id: parentId,
            },
          }
        : undefined,
      owner: {
        connect: {
          id: userId,
        },
      },
    },
  });

  createFolder({ filePath: `archives/${collectionId.id}` });

  return collectionId.id;
};

const createLink = async (
  userId: number,
  url: string,
  collectionId: number,
  name?: string,
  description?: string,
  tags?: string[]
) => {
  await prisma.link.create({
    data: {
      name: name || "",
      url,
      description,
      collectionId,
      tags:
        tags && tags[0]
          ? {
              connectOrCreate: tags.map((tag: string) => {
                return (
                  {
                    where: {
                      name_ownerId: {
                        name: tag.trim(),
                        ownerId: userId,
                      },
                    },
                    create: {
                      name: tag.trim(),
                      owner: {
                        connect: {
                          id: userId,
                        },
                      },
                    },
                  } || undefined
                );
              }),
            }
          : undefined,
    },
  });
};
