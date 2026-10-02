import { meiliClient } from "@linkwarden/lib/meilisearchClient";
import { delay } from "@linkwarden/lib/utils";
import { prisma } from "@linkwarden/prisma";
import getLinkBatch from "../lib/getLinkBatch";
import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";

const takeCount = Number(process.env.INDEX_TAKE_COUNT || "") || 50;

// Meilisearch rejects request bodies over its payload size limit (~95 MiB by
// default), which a batch holding a few links with very large `textContent`
// can exceed. Send the documents in smaller requests instead.
function chunkByPayloadSize<T>(items: T[]) {
  const maxBytes = 80 * 1024 * 1024;
  const chunks: T[][] = [];
  const oversized: T[] = [];
  let chunk: T[] = [];
  let chunkBytes = 2; // the enclosing "[]"

  for (const item of items) {
    const itemBytes = Buffer.byteLength(JSON.stringify(item), "utf-8") + 1;

    // A single item past the limit can't be split any further, so set it aside
    // instead of building a request that's bound to be rejected.
    if (2 + itemBytes > maxBytes) {
      oversized.push(item);
      continue;
    }

    if (chunk.length > 0 && chunkBytes + itemBytes > maxBytes) {
      chunks.push(chunk);
      chunk = [];
      chunkBytes = 2;
    }

    chunk.push(item);
    chunkBytes += itemBytes;
  }

  if (chunk.length > 0) chunks.push(chunk);

  return { chunks, oversized };
}

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

  const TRIAL_PERIOD_DAYS = process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14;
  const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

  while (true) {
    const links = await getLinkBatch({
      where: {
        AND: [
          {
            OR: [
              { indexVersion: { not: MEILI_INDEX_VERSION } },
              { indexVersion: null },
            ],
          },
          {
            ...(process.env.STRIPE_SECRET_KEY
              ? {
                  createdBy: {
                    OR: [
                      { subscriptions: { is: { active: true } } },
                      { parentSubscription: { is: { active: true } } },
                      ...(REQUIRE_CC
                        ? []
                        : [
                            {
                              createdAt: {
                                gte: new Date(
                                  new Date().getTime() -
                                    Number(TRIAL_PERIOD_DAYS) * 86400000
                                ),
                              },
                            },
                          ]),
                    ],
                  },
                }
              : {}),
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
      indexVersion: MEILI_INDEX_VERSION,
    }));

    const { chunks, oversized } = chunkByPayloadSize(docs);
    const indexedIds: number[] = [];

    if (oversized.length > 0) {
      console.error(
        "\x1b[34m%s\x1b[0m",
        `Skipping ${oversized.length} link${
          oversized.length === 1 ? "" : "s"
        } too large to index: ${oversized.map((doc) => doc.id).join(", ")}`
      );

      indexedIds.push(...oversized.map((doc) => doc.id));
    }

    try {
      for (const chunk of chunks) {
        const task = await meiliClient.index("links").addDocuments(chunk);
        const result = await meiliClient
          .index("links")
          .waitForTask(task.taskUid, {
            timeOutMs: Number(process.env.MEILI_TIMEOUT) || 1000000,
          });

        if (result.status !== "succeeded")
          throw new Error(
            `Indexing task ${task.taskUid} ${result.status}: ${
              result.error?.message ?? "no error message"
            }`
          );

        indexedIds.push(...chunk.map((doc) => doc.id));
      }
    } catch (err) {
      console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
    }

    if (indexedIds.length > 0)
      await prisma.link.updateMany({
        where: { id: { in: indexedIds } },
        data: { indexVersion: MEILI_INDEX_VERSION },
      });

    const indexesLeft = await prisma.link.count({
      where: {
        OR: [
          { indexVersion: { not: MEILI_INDEX_VERSION } },
          { indexVersion: null },
        ],
      },
    });

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Indexed ${indexedIds.length} link${
        indexedIds.length === 1 ? "" : "s"
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
