import "dotenv/config";
import { prisma } from "@linkwarden/prisma";
import archiveHandler from "../lib/api/archiveHandler";
import Parser from "rss-parser";
import { LinkWithCollectionOwnerAndTags } from "../types/global";
import getLinkBatch from "../lib/api/getLinkBatch";
import { meiliClient } from "../lib/api/meilisearchClient";
import rssHandler from "../lib/api/rssHandler";

const archiveTakeCount = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;
const indexTakeCount = Number(process.env.INDEX_TAKE_COUNT || "") || 50;

function delay(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

const pollingIntervalInSeconds =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) * 60; // Default to one hour if not set

async function startRSSPolling() {
  console.log("\x1b[34m%s\x1b[0m", "Starting RSS polling...");
  while (true) {
    const rssSubscriptions = await prisma.rssSubscription.findMany({});

    const parser = new Parser();

    await Promise.all(
      rssSubscriptions.map(async (rssSubscription) => {
        rssHandler(rssSubscription, parser);
      })
    );
    await delay(pollingIntervalInSeconds);
  }
}

const archiveIntervalInSeconds =
  Number(process.env.ARCHIVE_SCRIPT_INTERVAL) || 10;

async function startArchiveProcessing() {
  console.log("\x1b[34m%s\x1b[0m", "Starting link preservation...");
  while (true) {
    const links = await getLinkBatch({
      where: {
        url: { not: null },
        OR: [
          {
            image: null,
          },
          {
            pdf: null,
          },
          {
            readable: null,
          },
          {
            monolith: null,
          },
          {
            createdBy: {
              aiTagExistingLinks: true,
              NOT: {
                aiTaggingMethod: "DISABLED",
              },
            },
            aiTagged: false,
          },
        ],
      },
      take: archiveTakeCount,
      include: {
        collection: {
          include: {
            owner: true,
          },
        },
        tags: true,
      },
    });

    const archiveLink = async (link: LinkWithCollectionOwnerAndTags) => {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `Processing link ${link.url} for user ${link.collection.ownerId}`
        );

        await archiveHandler(link);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );
      }
    };

    // Process each link in the batch concurrently
    const processingPromises = links.map((e) => archiveLink(e));

    await Promise.allSettled(processingPromises);
    await delay(archiveIntervalInSeconds);
  }
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
      timeOutMs: 1000000,
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
      timeOutMs: 1000000,
    })
    .catch((err) => {
      console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
    });

  // if (process.env.NODE_ENV !== "production") await clearIndexes(); // For development/debugging purposes ONLY! This function clears all the indexes and you'll have to reindex everything...
}

export async function startIndexing() {
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
      take: indexTakeCount,
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
      await delay(archiveIntervalInSeconds);
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
        timeOutMs: 300000,
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

    await delay(archiveIntervalInSeconds);
  }
}

async function init() {
  console.log("\x1b[34m%s\x1b[0m", "Initializing the worker...");
  startRSSPolling();
  startArchiveProcessing();
  startIndexing();
}

init();

const clearIndexes = async () => {
  console.log("Clearing db indexes...");

  const clearedLinks = await prisma.link.updateMany({
    where: {},
    data: {
      indexVersion: null,
    },
  });

  console.log("Cleared db indexes:", clearedLinks);

  if (!meiliClient) return;

  const deleteAllDocuments = await meiliClient
    .index("links")
    .deleteAllDocuments();

  await meiliClient.index("links").waitForTask(deleteAllDocuments.taskUid, {
    timeOutMs: 1000000,
  });
};
