import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import { hasPassedLimit } from "@linkwarden/lib/verifyCapacity";

// https://github.com/karakeep-app/karakeep/blob/main/packages/shared/import-export/exporters.ts
type KarakeepBookmark = {
  createdAt: number;
  title: string | null;
  tags: string[];
  lists?: string[];
  content:
    | { type: "link"; url: string }
    | { type: "text"; text: string }
    | null;
  note: string | null;
  archived?: boolean;
};

type KarakeepList = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: "manual" | "smart";
  query: string | null;
  parentId: string | null;
};

type KarakeepBackup = {
  bookmarks: KarakeepBookmark[];
  lists?: KarakeepList[];
};

export default async function importFromKarakeep(
  userId: number,
  rawData: string
) {
  const data: KarakeepBackup = JSON.parse(rawData);

  if (!Array.isArray(data?.bookmarks)) {
    return {
      response: "Invalid Karakeep export file.",
      status: 400,
    };
  }

  // Text notes have no Linkwarden equivalent, so only link bookmarks are imported.
  const backup = data.bookmarks.filter(
    (e) => e.content?.type === "link" && e.content.url
  );

  // Smart lists are saved searches without stored members, so they are skipped.
  const lists = (data.lists || []).filter((e) => e.type === "manual");

  const totalImports = backup.length;

  const hasTooManyLinks = await hasPassedLimit(userId, totalImports);

  if (hasTooManyLinks) {
    return {
      response: `Your subscription has reached the maximum number of links allowed.`,
      status: 400,
    };
  }

  await prisma
    .$transaction(
      async () => {
        const collectionIds = new Map<string, number>();

        const createCollection = async (
          name: string,
          description?: string | null,
          parentId?: number
        ) => {
          const newCollection = await prisma.collection.create({
            data: {
              owner: {
                connect: {
                  id: userId,
                },
              },
              name: name.trim().slice(0, 254) || "Untitled Collection",
              description: description?.trim().slice(0, 254) || "",
              parent: parentId
                ? {
                    connect: {
                      id: parentId,
                    },
                  }
                : undefined,
              createdBy: {
                connect: {
                  id: userId,
                },
              },
            },
          });

          createFolder({ filePath: `archives/${newCollection.id}` });

          return newCollection.id;
        };

        // Karakeep lists can be nested, create parents before their children.
        const importList = async (list: KarakeepList, path: string[]) => {
          if (collectionIds.has(list.id)) return;

          const parent = lists.find((e) => e.id === list.parentId);

          if (parent && !path.includes(parent.id))
            await importList(parent, [...path, list.id]);

          collectionIds.set(
            list.id,
            await createCollection(
              list.name,
              list.description,
              parent ? collectionIds.get(parent.id) : undefined
            )
          );
        };

        for (const list of lists) {
          await importList(list, []);
        }

        let fallbackCollectionId: number | undefined;

        for (const link of backup) {
          const url = link.content?.type === "link" ? link.content.url : "";

          try {
            new URL(url.trim());
          } catch (err) {
            continue;
          }

          // A Karakeep bookmark can be in several lists, but a Linkwarden link
          // belongs to a single collection, so the first list is used.
          let collectionId = link.lists
            ?.map((id) => collectionIds.get(id))
            .find((id) => id !== undefined);

          if (!collectionId) {
            fallbackCollectionId ??= await createCollection("Karakeep Imports");
            collectionId = fallbackCollectionId;
          }

          const tags = (link.tags || [])
            .map((tag) => tag?.trim().slice(0, 49))
            .filter((tag, i, arr) => tag && arr.indexOf(tag) === i);

          await prisma.link.create({
            data: {
              url: url.trim().slice(0, 2047),
              name: link.title?.trim().slice(0, 254) || "",
              description: link.note?.trim().slice(0, 2047) || "",
              importDate: link.createdAt
                ? new Date(link.createdAt * 1000)
                : null,
              collection: {
                connect: {
                  id: collectionId,
                },
              },
              createdBy: {
                connect: {
                  id: userId,
                },
              },
              tags: tags[0]
                ? {
                    connectOrCreate: tags.map((tag) => ({
                      where: {
                        name_ownerId: {
                          name: tag,
                          ownerId: userId,
                        },
                      },
                      create: {
                        name: tag,
                        owner: {
                          connect: {
                            id: userId,
                          },
                        },
                      },
                    })),
                  }
                : undefined,
            },
          });
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
