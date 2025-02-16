import "dotenv/config";
import { prisma } from "../lib/api/db";
import archiveHandler from "../lib/api/archiveHandler";
import Parser from "rss-parser";
import { hasPassedLimit } from "../lib/api/verifyCapacity";
import { LinkWithCollectionOwnerAndTags } from "../types/global";
import getLinkBatch from "../lib/api/getLinkBatch";
import { meiliClient } from "../lib/api/meilisearchClient";

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
        try {
          const feed = await parser.parseURL(rssSubscription.url);

          if (
            rssSubscription.lastBuildDate &&
            new Date(rssSubscription.lastBuildDate) <
              new Date(feed.lastBuildDate)
          ) {
            console.log(
              "\x1b[34m%s\x1b[0m",
              `Processing new RSS feed items for ${rssSubscription.name}`
            );

            const newItems = feed.items.filter((item) => {
              const itemPubDate = item.pubDate ? new Date(item.pubDate) : null;
              return (
                itemPubDate && itemPubDate > rssSubscription.lastBuildDate!
              );
            });

            const hasTooManyLinks = await hasPassedLimit(
              rssSubscription.ownerId,
              newItems.length
            );

            if (hasTooManyLinks) {
              console.log(
                "\x1b[34m%s\x1b[0m",
                `User ${rssSubscription.ownerId} has too many links. Skipping new RSS feed items.`
              );
              return;
            }

            // Create all links concurrently
            await Promise.all(
              newItems.map(async (item) => {
                return prisma.link.create({
                  data: {
                    name: item.title,
                    url: item.link,
                    type: "link",
                    createdBy: {
                      connect: {
                        id: rssSubscription.ownerId,
                      },
                    },
                    collection: {
                      connect: {
                        id: rssSubscription.collectionId,
                      },
                    },
                  },
                });
              })
            );

            // Update the lastBuildDate in the database
            await prisma.rssSubscription.update({
              where: { id: rssSubscription.id },
              data: { lastBuildDate: new Date(feed.lastBuildDate) },
            });
          }
        } catch (error) {
          console.error(
            "\x1b[34m%s\x1b[0m",
            `Error processing RSS feed ${rssSubscription.url}:`,
            error
          );
        }
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
      // "collectionName",
      // "tagNames",
    ]);
  await meiliClient
    .index("links")
    .waitForTask(updateFilterableAttributes.taskUid);

  const updateSortableAttributes = await meiliClient
    .index("links")
    .updateSortableAttributes(["id", "name"]);

  await meiliClient
    .index("links")
    .waitForTask(updateSortableAttributes.taskUid);
}

export async function startIndexing() {
  if (!meiliClient) return;

  await setupLinksIndexSchema();

  console.log("\x1b[34m%s\x1b[0m", "Starting link indexing...");

  const INDEX_VERSION = 1;

  while (true) {
    const links = await getLinkBatch({
      where: {
        indexVersion: { not: INDEX_VERSION },
        lastPreserved: { not: null },
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
      collectionName: link.collection.name,
      tags: link.tags.map((t) => t.name),
      pinnedBy: link.pinnedBy.map((p) => p.id),
    }));

    const task = await meiliClient.index("links").addDocuments(docs);
    await meiliClient
      .index("links")
      .waitForTask(task.taskUid, {
        timeOutMs: 30000,
      })
      .catch((err) => {
        console.error("\x1b[34m%s\x1b[0m", `Error indexing links:`, err);
      });

    const ids = links.map((l) => l.id);
    await prisma.link.updateMany({
      where: { id: { in: ids } },
      data: { indexVersion: INDEX_VERSION },
    });

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Indexed ${links.length} link${links.length === 1 ? "" : "s"}.`
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
