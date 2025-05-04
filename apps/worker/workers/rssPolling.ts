import { prisma } from "@linkwarden/prisma";
import Parser from "rss-parser";
import { delay, rssHandler } from "@linkwarden/lib";

const pollingIntervalInSeconds =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) * 60; // Default to one hour if not set

export async function startRSSPolling() {
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
