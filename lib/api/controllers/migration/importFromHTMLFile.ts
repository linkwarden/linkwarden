import { prisma } from "@/lib/api/db";
import { Backup } from "@/types/global";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";

export default async function importFromHTMLFile(
  userId: number,
  rawData: string
) {
  const dom = new JSDOM(rawData);
  const document = dom.window.document;

  const folders = document.querySelectorAll("H3");

  await prisma
    .$transaction(
      async () => {
        // @ts-ignore
        for (const folder of folders) {
          const findCollection = await prisma.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              collections: {
                where: {
                  name: folder.textContent.trim(),
                },
              },
            },
          });

          const checkIfCollectionExists = findCollection?.collections[0];

          let collectionId = findCollection?.collections[0]?.id;

          if (!checkIfCollectionExists || !collectionId) {
            const newCollection = await prisma.collection.create({
              data: {
                name: folder.textContent.trim(),
                description: "",
                color: "#0ea5e9",
                isPublic: false,
                ownerId: userId,
              },
            });

            createFolder({ filePath: `archives/${newCollection.id}` });

            collectionId = newCollection.id;
          }

          createFolder({ filePath: `archives/${collectionId}` });

          const bookmarks = folder.nextElementSibling.querySelectorAll("A");
          for (const bookmark of bookmarks) {
            await prisma.link.create({
              data: {
                name: bookmark.textContent.trim(),
                url: bookmark.getAttribute("HREF"),
                tags: bookmark.getAttribute("TAGS")
                  ? {
                      connectOrCreate: bookmark
                        .getAttribute("TAGS")
                        .split(",")
                        .map((tag: string) =>
                          tag
                            ? {
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
                              }
                            : undefined
                        ),
                    }
                  : undefined,
                description: bookmark.getAttribute("DESCRIPTION")
                  ? bookmark.getAttribute("DESCRIPTION")
                  : "",
                collectionId: collectionId,
                createdAt: new Date(),
              },
            });
          }
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
