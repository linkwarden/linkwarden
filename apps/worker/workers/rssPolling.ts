import { prisma } from "@linkwarden/prisma";
import Parser from "rss-parser";
import { delay } from "@linkwarden/lib/utils";
import { rssHandler } from "@linkwarden/lib/rssHandler";
import { assertUrlIsSafeForServerSideFetch } from "@linkwarden/lib/ssrf";
import { safeFetch } from "@linkwarden/lib/safeFetch";

const pollingIntervalInSeconds =
  (Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || 60) * 60;

const TRIAL_PERIOD_DAYS = process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14;
const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

const feedTimeoutInMs = 30_000;

export async function startRSSPolling() {
  console.log("\x1b[34m%s\x1b[0m", "Starting RSS polling...");
  while (true) {
    const rssSubscriptions = await prisma.rssSubscription.findMany({
      where: {
        collection: {
          owner: {
            ...(process.env.STRIPE_SECRET_KEY
              ? {
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
                }
              : {}),
          },
        },
      },
    });

    const parser = new Parser();

    await Promise.allSettled(
      rssSubscriptions.map(async (rssSubscription) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), feedTimeoutInMs);

        try {
          await assertUrlIsSafeForServerSideFetch(rssSubscription.url);
          const xml = await safeFetch(rssSubscription.url, {
            signal: controller.signal,
            timeout: feedTimeoutInMs,
          }).then((res) => res.text());
          const feed = await parser.parseString(xml);
          await rssHandler(rssSubscription, feed);
        } catch (error) {
          console.error(
            "\x1b[34m%s\x1b[0m",
            `Error processing RSS feed ${rssSubscription.url}:`,
            error
          );
        } finally {
          clearTimeout(timeout);
        }
      })
    );
    await delay(pollingIntervalInSeconds);
  }
}
