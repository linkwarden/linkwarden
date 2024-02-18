import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

export default async function importFromHTMLFile(
  userId: number,
  rawData: string
) {
  const dom = new JSDOM(rawData);
  const document = dom.window.document;

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

  const folders = document.querySelectorAll("H3");
  let unorganizedCollectionId: number | null = null;

  if (folders.length === 0) {
    const unorganizedCollection = await prisma.collection.findFirst({
      where: {
        name: "Imported",
        ownerId: userId,
      },
    });

    if (!unorganizedCollection) {
      const newUnorganizedCollection = await prisma.collection.create({
        data: {
          name: "Imported",
          description:
            "Automatically created collection for imported bookmarks.",
          ownerId: userId,
        },
      });
      unorganizedCollectionId = newUnorganizedCollection.id;
    } else {
      unorganizedCollectionId = unorganizedCollection.id;
    }

    createFolder({ filePath: `archives/${unorganizedCollectionId}` });
  }

  await prisma
    .$transaction(
      async () => {
        if (unorganizedCollectionId) {
          // @ts-ignore
          for (const bookmark of bookmarks) {
            createBookmark(userId, bookmark, unorganizedCollectionId);
          }
        } else {
          // @ts-ignore
          for (const folder of folders) {
            await createCollectionAndBookmarks(
              userId,
              folder,
              folder.nextElementSibling,
              null
            );
          }
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}

const createCollectionAndBookmarks = async (
  userId: number,
  folder: any,
  folderContent: any,
  parentId: number | null
) => {
  const findCollection = await prisma.collection.findFirst({
    where: {
      name: folder.textContent.trim(),
      ownerId: userId,
    },
  });

  const checkIfCollectionExists = findCollection;
  let collectionId = findCollection?.id;

  if (!checkIfCollectionExists || !collectionId) {
    const newCollection = await prisma.collection.create({
      data: {
        name: folder.textContent.trim(),
        description: "",
        color: "#0ea5e9",
        isPublic: false,
        ownerId: userId,
        parentId
      },
    });

    createFolder({ filePath: `archives/${newCollection.id}` });

    collectionId = newCollection.id;
  }

  createFolder({ filePath: `archives/${collectionId}` });

  const bookmarks = folderContent.querySelectorAll("A");
  for (const bookmark of bookmarks) {
    createBookmark(userId, bookmark, collectionId);
  }

  const subfolders = folderContent.querySelectorAll("H3");
  for (const subfolder of subfolders) {
    await createCollectionAndBookmarks(userId, subfolder, subfolder.nextElementSibling, collectionId);
  }
};

const createBookmark = async (
  userId: number,
  bookmark: any,
  collectionId: number
) => {
  // Move up to the parent node (<DT>) and then find the next sibling
  let parentDT = bookmark.parentNode;
  let nextSibling = parentDT ? parentDT.nextSibling : null;
  let description = "";

  // Loop through siblings to skip any potential text nodes or whitespace
  while (nextSibling && nextSibling.nodeType !== 1) {
    nextSibling = nextSibling.nextSibling;
  }

  // Check if the next sibling element is a <DD> tag and use its content as the description
  if (nextSibling && nextSibling.tagName === "DD") {
    description = nextSibling.textContent.trim();
  }

  const linkName = bookmark.textContent.trim();
  const linkURL = bookmark.getAttribute("HREF");

  const existingLink = await prisma.link.findFirst({
    where: {
      url: linkURL,
      collectionId
    },
  });

  // Create the link only if it doesn't already exist
  if (!existingLink) {
    await prisma.link.create({
      data: {
        name: linkName,
        url: linkURL,
        tags: bookmark.getAttribute("TAGS")
          ? {
            connectOrCreate: bookmark
              .getAttribute("TAGS")
              .split(",")
              .map((tag: string) =>
                tag
                  ? {
                    where: {
                      data: {
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
                  }
                  : undefined
              ),
          }
          : undefined,
        description,
        collectionId,
      },
    });
  }
};