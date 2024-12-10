import "dotenv/config";
import { Collection, Link, User } from "@prisma/client";
import { prisma } from "../lib/api/db";
import archiveHandler from "../lib/api/archiveHandler";
import Parser from "rss-parser";
import { hasPassedLimit } from "../lib/api/verifyCapacity";

const args = process.argv.slice(2).join(" ");

const archiveTakeCount = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

async function processBatch() {
  const linksOldToNew = await prisma.link.findMany({
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
      ],
    },
    take: archiveTakeCount,
    orderBy: { id: "asc" },
    include: {
      collection: {
        include: {
          owner: true,
        },
      },
    },
  });

  const linksNewToOld = await prisma.link.findMany({
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
      ],
    },
    take: archiveTakeCount,
    orderBy: { id: "desc" },
    include: {
      collection: {
        include: {
          owner: true,
        },
      },
    },
  });

  const archiveLink = async (link: LinksAndCollectionAndOwner) => {
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
  const processingPromises = [...linksOldToNew, ...linksNewToOld]
    // Make sure we don't process the same link twice
    .filter((value, index, self) => {
      return self.findIndex((item) => item.id === value.id) === index;
    })
    .map((e) => archiveLink(e));

  await Promise.allSettled(processingPromises);
}

async function fetchAndProcessRSS() {
  const rssSubscriptions = await prisma.rssSubscription.findMany({});
  const parser = new Parser();

  rssSubscriptions.forEach(async (rssSubscription) => {
    try {
      const feed = await parser.parseURL(rssSubscription.url);

      if (
        rssSubscription.lastBuildDate &&
        new Date(rssSubscription.lastBuildDate) < new Date(feed.lastBuildDate)
      ) {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `Processing new RSS feed items for ${rssSubscription.name}`
        );

        const newItems = feed.items.filter((item) => {
          const itemPubDate = item.pubDate ? new Date(item.pubDate) : null;
          return itemPubDate && itemPubDate > rssSubscription.lastBuildDate!; // We know lastBuildDate is not null here
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

        newItems.forEach(async (item) => {
          await prisma.link.create({
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
        });

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
  });
}

function delay(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

const pollingIntervalInSeconds =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) * 60; // Default to one hour if not set

async function startRSSPolling() {
  console.log("\x1b[34m%s\x1b[0m", "Starting RSS polling...");
  while (true) {
    await fetchAndProcessRSS();
    await delay(pollingIntervalInSeconds);
  }
}

const archiveIntervalInSeconds =
  Number(process.env.ARCHIVE_SCRIPT_INTERVAL) || 10;

async function startArchiveProcessing() {
  console.log("\x1b[34m%s\x1b[0m", "Starting link preservation...");
  while (true) {
    await processBatch();
    await delay(archiveIntervalInSeconds);
  }
}

async function init() {
  console.log("\x1b[34m%s\x1b[0m", "Initializing application...");
  startRSSPolling();
  startArchiveProcessing();
}

init();
