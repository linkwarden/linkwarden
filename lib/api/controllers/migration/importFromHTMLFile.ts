import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";
import { hasPassedLimit } from "../../verifyCapacity";

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
      response: `Your subscription have reached the maximum number of links allowed.`,
      status: 400,
    };
  }

  processNodes(document);

  for (const item of document.children) {
    await processBookmarks(userId, item);
  }

  return { response: "Success.", status: 200 };
}

async function processBookmarks(
  userId: number,
  data: Element,
  parentCollectionId?: number
) {
  for (const item of data.children) {
    if (item.tagName === "DT") {
      // process collection or sub-collection

      let collectionId: number | undefined;
      const collectionName = item.getElementsByTagName("h3")[0];

      if (collectionName) {
        const collectionNameContent = collectionName?.textContent;
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
      await processBookmarks(userId, item, collectionId || parentCollectionId);
    } else if (item.tagName === "A") {
      // process link

      const linkUrl = item?.getAttribute("href");
      const linkName =
        (
          item?.childNodes &&
          Array.from(item.childNodes).find((e) => e.nodeType === 3)
        )?.nodeValue ?? undefined;
      const linkTags = item?.getAttribute("tags")?.split(",");

      // set date if available
      const linkDateValue = item?.getAttribute("add_date");

      const linkDate = linkDateValue
        ? new Date(Number(linkDateValue) * 1000)
        : undefined;

      const linkDesc = item?.getElementsByTagName("dd")[0]?.textContent || "";

      if (linkUrl && parentCollectionId) {
        await createLink(
          userId,
          linkUrl,
          parentCollectionId,
          linkName,
          linkDesc,
          linkTags,
          linkDate
        );
      } else if (linkUrl) {
        // create a collection named "Imported Bookmarks" and add the link to it
        const collectionId = await createCollection(userId, "Imports");

        await createLink(
          userId,
          linkUrl,
          collectionId,
          linkName,
          linkDesc,
          linkTags,
          linkDate
        );
      }

      await processBookmarks(userId, item, parentCollectionId);
    } else {
      // process anything else
      await processBookmarks(userId, item, parentCollectionId);
    }
  }
}

const createCollection = async (
  userId: number,
  collectionName: string,
  parentId?: number
) => {
  collectionName = collectionName.trim().slice(0, 254);

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
  url = url.trim().slice(0, 254);
  try {
    new URL(url);
  } catch (e) {
    return;
  }
  tags = tags?.map((tag) => tag.trim().slice(0, 49));
  name = name?.trim().slice(0, 254);
  description = description?.trim().slice(0, 254);
  if (importDate) {
    const dateString = importDate.toISOString();
    if (dateString.length > 50) {
      importDate = undefined;
    }
  }

  await prisma.link.create({
    data: {
      name: name || "",
      url,
      description,
      collectionId,
      createdById: userId,
      tags: tags?.[0]
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

function processNodes(document: Document): void {
  const findAndProcessDL = (node: Element) => {
    if (node.tagName === "DL") {
      processDLChildren(node);
    } else if (node.children?.length) {
      for (const child of node.children) {
        findAndProcessDL(child);
      }
    }
  };

  const processDLChildren = (dlNode: Element) => {
    for (let i = 0; i < dlNode.children.length; i += 1) {
      const child = dlNode.children[i];
      if (child?.tagName === "DT") {
        const nextSibling = dlNode.children[i + 1];
        if (nextSibling?.tagName === "DD") {
          const aElement = child.getElementsByTagName("a")[0];
          if (aElement) {
            // Add the 'dd' element as a child of the 'a' element
            aElement.appendChild(nextSibling);
            // Remove the 'dd' from the parent 'dl' to avoid duplicate processing
            dlNode.removeChild(nextSibling);
            // Adjust the loop counter due to the removal
          }
        }
      }
    }
  };

  for (const node of document.children) {
    findAndProcessDL(node);
  }
}
