import { delay, meiliClient } from "@linkwarden/lib";
import { prisma } from "@linkwarden/prisma";
import getLinkBatch from "../lib/getLinkBatch";

const takeCount = Number(process.env.INDEX_TAKE_COUNT || "") || 50;

async function setupLinksIndexSchema() {
  if (!meiliClient) return;

  let linksIndexExists = true;
  try {
    await meiliClient.getIndex("links");
  } catch (err) {
    linksIndexExists = false;
  }

  if (!linksIndexExists) {
    await meiliClient.createIndex("links", { primaryKey: "id" });
  }

  const updateFilterableAttributes = await meiliClient
    .index("links")
    .updateFilterableAttributes([
      "collectionOwnerId",
      "collectionMemberIds",
      "collectionName",
      "tags",
      "pinnedBy",
      "url",
      "type",
      "name",
      "description",
      "collectionIsPublic",
      "creationTimestamp",
    ]);
  await meiliClient
    .index("links")
    .waitForTask(updateFilterableAttributes.taskUid, {
      timeOutMs: Number(process.env.MEILI_TIMEOUT) || 1000000,
    })
    .catch((err) => {
      console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
    });

  const updateSortableAttributes = await meiliClient
    .index("links")
    .updateSortableAttributes(["id", "name"]);

  await meiliClient
    .index("links")
    .waitForTask(updateSortableAttributes.taskUid, {
      timeOutMs: Number(process.env.MEILI_TIMEOUT) || 1000000,
    })
    .catch((err) => {
      console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
    });

  // if (process.env.NODE_ENV !== "production") await clearIndexes(); // For development/debugging purposes ONLY! This function clears all the indexes and you'll have to reindex everything...
}

export async function startIndexing(interval = 10) {
  if (!meiliClient) return;

  await setupLinksIndexSchema();

  console.log("\x1b[34m%s\x1b[0m", "Starting link indexing...");

  const INDEX_VERSION = 1;

  while (true) {
    const links = await getLinkBatch({
      where: {
        AND: [
          {
            OR: [
              { indexVersion: { not: INDEX_VERSION } },
              { indexVersion: null },
            ],
          },
          {
            OR: [
              { lastPreserved: { not: null } },
              {
                url: null,
              },
            ],
          },
        ],
      },
      take: takeCount,
      include: {
        collection: {
          include: {
            owner: true,
            members: {
              select: { userId: true },
            },
          },
        },
        tags: {
          select: { name: true },
        },
        pinnedBy: {
          select: { id: true },
        },
      },
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

    const docs = links.map((link) => ({
      ...link,
      collectionOwnerId: link.collection.ownerId,
      collectionMemberIds: link.collection.members.map((m) => m.userId),
      collectionIsPublic: link.collection.isPublic,
      collectionName: link.collection.name,
      tags: link.tags.map((t) => t.name),
      pinnedBy: link.pinnedBy.map((p) => p.id),
      creationTimestamp: Date.parse(link.createdAt.toISOString()) / 1000,
      indexVersion: INDEX_VERSION,
    }));

    const task = await meiliClient.index("links").addDocuments(docs);
    await meiliClient
      .index("links")
      .waitForTask(task.taskUid, {
        timeOutMs: Number(process.env.MEILI_TIMEOUT) || 1000000,
      })
      .catch((err) => {
        console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
      });

    const ids = links.map((l) => l.id);
    await prisma.link.updateMany({
      where: { id: { in: ids } },
      data: { indexVersion: INDEX_VERSION },
    });

    const indexesLeft = await prisma.link.count({
      where: {
        OR: [{ indexVersion: { not: INDEX_VERSION } }, { indexVersion: null }],
        lastPreserved: { not: null },
      },
    });

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Indexed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${indexesLeft} left.`
    );

    await delay(interval);
  }
}

// const clearIndexes = async () => {
//   console.log("Clearing db indexes...");

//   const clearedLinks = await prisma.link.updateMany({
//     where: {},
//     data: {
//       indexVersion: null,
//     },
//   });

//   console.log("Cleared db indexes:", clearedLinks);

//   if (!meiliClient) return;

//   const deleteAllDocuments = await meiliClient
//     .index("links")
//     .deleteAllDocuments();

//   await meiliClient.index("links").waitForTask(deleteAllDocuments.taskUid, {
//     timeOutMs: 1000000,
//   });
// };
