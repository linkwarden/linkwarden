import { prisma } from "@linkwarden/prisma";
import Parser from "rss-parser";
import { delay } from "@linkwarden/lib/utils";
import { rssHandler } from "@linkwarden/lib/rssHandler";
import { assertUrlIsSafeForServerSideFetch } from "@linkwarden/lib/ssrf";
import { safeFetch } from "@linkwarden/lib/safeFetch";

const pollingIntervalInSeconds =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) * 60; // Default to one hour if not set

export async function startRSSPolling() {
  console.log("\x1b[34m%s\x1b[0m", "Starting RSS polling...");
  while (true) {
    const rssSubscriptions = await prisma.rssSubscription.findMany({});

    const parser = new Parser();

    await Promise.all(
      rssSubscriptions.map(async (rssSubscription) => {
        try {
          await assertUrlIsSafeForServerSideFetch(rssSubscription.url);
          const xml = await safeFetch(rssSubscription.url).then((res) =>
            res.text()
          );
          const feed = await parser.parseString(xml);
          await rssHandler(rssSubscription, feed);
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
