import "dotenv/config";
import { Collection, Link, User } from "@prisma/client";
import { prisma } from "../lib/api/db";
import archiveHandler, { getBrowserOptions } from "../lib/api/archiveHandler";
import Parser from "rss-parser";
import { hasPassedLimit } from "../lib/api/verifyCapacity";
import autoTagLink from "../lib/api/autoTagLink";
import { chromium, devices } from "playwright";

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

async function processAITagging() {
  const links = await prisma.link.findMany({
    where: {
      aiTagged: false,
      url: { not: null },
      createdBy: {
        aiTagExistingLinks: true,
        aiTaggingMethod: {
          in: ["GENERATE", "EXISTING", "PREDEFINED"],
        },
      },
    },
    include: {
      createdBy: true,
    },
  });

  await Promise.all(
    links.map(async (link) => {
      let browser = null;
      try {
        if (link.createdBy && link.url) {
          const browserOptions = getBrowserOptions();
          browser = await chromium.launch(browserOptions);

          const context = await browser.newContext({
            ...devices["Desktop Chrome"],
            ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === "true",
          });

          const page = await context.newPage();

          await page.goto(link.url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });

          const metaDescription = await page.evaluate(() => {
            const description = document.querySelector(
              'meta[name="description"]'
            );
            return description?.getAttribute("content") ?? undefined;
          });

          await autoTagLink(link.createdBy, link.id, metaDescription);

          // Mark the link as processed
          await prisma.link.update({
            where: { id: link.id },
            data: { aiTagged: true },
          });
        }
      } catch (error) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error auto-tagging link ${link.url}:`,
          error
        );

        // Mark the link as processed even if it failed to prevent endless retries
        await prisma.link.update({
          where: { id: link.id },
          data: { aiTagged: true },
        });
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    })
  );
}

async function fetchAndProcessRSS() {
  const rssSubscriptions = await prisma.rssSubscription.findMany({});
  const parser = new Parser();

  await Promise.all(
    rssSubscriptions.map(async (rssSubscription) => {
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
            return itemPubDate && itemPubDate > rssSubscription.lastBuildDate!;
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

const aiTaggingIntervalInSeconds =
  Number(process.env.AI_TAGGING_SCRIPT_INTERVAL) || 30;

async function startAITagging() {
  console.log("\x1b[34m%s\x1b[0m", "Starting AI tagging...");
  while (true) {
    await processAITagging();
    await delay(aiTaggingIntervalInSeconds);
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
  startAITagging();
  startArchiveProcessing();
}

init();
