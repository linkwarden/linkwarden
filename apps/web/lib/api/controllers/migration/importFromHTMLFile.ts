import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import { JSDOM } from "jsdom";
import { decodeHTML } from "entities";
import { parse, Node, Element, TextNode } from "himalaya";
import { hasPassedLimit } from "@linkwarden/lib/verifyCapacity";
import { nextCollectionOrder } from "@linkwarden/lib/linkOrder";
import { shortenText } from "@linkwarden/lib/shortenText";
import oldestFirst, { isStorableDate } from "@/lib/api/oldestFirst";

type ImportedLink = {
  url: string;
  collectionId: number;
  name?: string;
  description?: string;
  tags?: string[];
  importDate?: Date;
};

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

  const hasTooManyLinks = await hasPassedLimit(userId, totalImports);

  if (hasTooManyLinks) {
    return {
      response: `Your subscription has reached the maximum number of links allowed.`,
      status: 400,
    };
  }

  const jsonData = parse(document.documentElement.outerHTML);

  const processedArray = processNodes(jsonData);

  // Collections are created as the file is read, links once all of them are
  // known, so they can go in oldest first.
  const links: ImportedLink[] = [];

  for (const item of processedArray) {
    await processBookmarks(userId, item as Element, links);
  }

  for (const link of oldestFirst(links, (link) => link.importDate)) {
    await createLink(
      userId,
      link.url,
      link.collectionId,
      link.name,
      link.description,
      link.tags,
      link.importDate
    );
  }

  return { response: "Success.", status: 200 };
}

async function processBookmarks(
  userId: number,
  data: Node,
  links: ImportedLink[],
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
          const collectionNameContent = (collectionName.children[0] as TextNode)
            ?.content;
          if (collectionNameContent) {
            collectionId = await createCollection(
              userId,
              collectionNameContent,
              parentCollectionId
            );
          } else {
            // Handle the case when the collection name is empty
            collectionId = await createCollection(
              userId,
              "Untitled Collection",
              parentCollectionId
            );
          }
        }

        await processBookmarks(
          userId,
          item,
          links,
          collectionId || parentCollectionId
        );
      } else if (item.type === "element" && item.tagName === "a") {
        // process link
        const rawLinkUrl = item?.attributes.find(
          (e) => e.key.toLowerCase() === "href"
        )?.value;

        const linkUrl = decodeEntities(rawLinkUrl);

        const linkName = (
          item?.children.find((e) => e.type === "text") as TextNode
        )?.content;

        const linkTags = item?.attributes
          .find((e) => e.key === "tags")
          ?.value.split(",")
          .map(decodeEntities);

        // set date if available
        const linkDateValue = item?.attributes.find(
          (e) => e.key.toLowerCase() === "add_date"
        )?.value;

        const linkDate = dateFromAddDate(linkDateValue);

        let linkDesc =
          (
            (
              item?.children?.find(
                (e) => e.type === "element" && e.tagName === "dd"
              ) as Element
            )?.children[0] as TextNode
          )?.content || "";

        if (linkUrl && parentCollectionId) {
          links.push({
            url: linkUrl,
            collectionId: parentCollectionId,
            name: linkName,
            description: linkDesc,
            tags: linkTags,
            importDate: linkDate,
          });
        } else if (linkUrl) {
          // create a collection named "Imports" and add the link to it
          const collectionId = await createCollection(userId, "Imports");

          links.push({
            url: linkUrl,
            collectionId,
            name: linkName,
            description: linkDesc,
            tags: linkTags,
            importDate: linkDate,
          });
        }

        await processBookmarks(userId, item, links, parentCollectionId);
      } else {
        await processBookmarks(userId, item, links, parentCollectionId);
      }
    }
  }
}

const createCollection = async (
  userId: number,
  collectionName: string,
  parentId?: number
) => {
  collectionName = shortenText(collectionName.trim(), 254);

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
      createdBy: {
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
  tags?: string[],
  importDate?: Date
) => {
  url = shortenText(url.trim(), 2047);
  try {
    new URL(url);
  } catch (e) {
    return;
  }

  tags = tags?.map((tag) => shortenText(tag.trim(), 49));
  name = shortenText(name?.trim(), 254);
  description = shortenText(description?.trim(), 254);

  const collectionOrder = await nextCollectionOrder(collectionId);

  await prisma.link.create({
    data: {
      name: name || "",
      url,
      description,
      collectionId,
      collectionOrder,
      createdById: userId,
      tags:
        tags && tags[0]
          ? {
              connectOrCreate: tags.map((tag: string) => {
                return {
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
                };
              }),
            }
          : undefined,
      importDate: importDate || undefined,
    },
  });
};

function processNodes(nodes: Node[]) {
  const findAndProcessDL = (node: Node) => {
    if (node.type === "element" && node.tagName === "dl") {
      processDLChildren(node);
    } else if (
      node.type === "element" &&
      node.children &&
      node.children.length
    ) {
      node.children.forEach((child) => findAndProcessDL(child));
    }
  };

  const processDLChildren = (dlNode: Element) => {
    dlNode.children.forEach((child, i) => {
      if (child.type === "element" && child.tagName === "dt") {
        const nextSibling = dlNode.children[i + 1];
        if (
          nextSibling &&
          nextSibling.type === "element" &&
          nextSibling.tagName === "dd"
        ) {
          const aElement = child.children.find(
            (el) => el.type === "element" && el.tagName === "a"
          );
          if (aElement && aElement.type === "element") {
            // Add the 'dd' element as a child of the 'a' element
            aElement.children.push(nextSibling);
            // Remove the 'dd' from the parent 'dl' to avoid duplicate processing
            dlNode.children.splice(i + 1, 1);
          }
        }
      }
    });
  };

  nodes.forEach(findAndProcessDL);
  return nodes;
}

function decodeEntities(encoded: string | undefined): string {
  return decodeHTML(encoded ?? "");
}

// ADD_DATE is in seconds, though some tools write milliseconds, which read as
// seconds land past the year 9999. A value that's neither leaves the link without
// a date, so it shows the moment it was imported.
function dateFromAddDate(value: string | undefined) {
  if (!value) return undefined;

  const seconds = new Date(Number(value) * 1000);
  if (isStorableDate(seconds)) return seconds;

  const milliseconds = new Date(Number(value));
  if (isStorableDate(milliseconds)) return milliseconds;

  return undefined;
}
