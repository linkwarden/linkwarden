import { RssSubscription } from "@linkwarden/prisma/client";
import { hasPassedLimit } from "./verifyCapacity";
import { prisma } from "@linkwarden/prisma";
import Parser from "rss-parser";
import { assertUrlIsSafeForServerSideFetch } from "./ssrf";

export const rssHandler = async (
  rssSubscription: RssSubscription,
  feed: Parser.Output<any>
) => {
  try {
    const feedLastBuildDate = (feed as any).lastBuildDate as
      | string
      | Date
      | undefined;
    const feedLastPubDate =
      feedLastBuildDate ??
      feed.items.reduce((acc, item) => {
        const itemPubDate = item.pubDate ? new Date(item.pubDate) : null;
        return itemPubDate && itemPubDate > acc ? itemPubDate : acc;
      }, new Date(0));

    if (!feedLastPubDate)
      throw new Error(
        `No lastBuildDate or pubDate found in the following RSS feed: ${rssSubscription.url}`
      );

    if (
      !rssSubscription.lastBuildDate ||
      (rssSubscription.lastBuildDate &&
        new Date(rssSubscription.lastBuildDate) < new Date(feedLastPubDate))
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
          if (!item.link) return null;

          try {
            await assertUrlIsSafeForServerSideFetch(item.link);
          } catch {
            return null;
          }

          return prisma.link.create({
            data: {
              name: item.title,
              url: item.link,
              type: "url",
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
        data: { lastBuildDate: new Date(feedLastPubDate) },
      });
    }
  } catch (error) {
    console.error(
      "\x1b[34m%s\x1b[0m",
      `Error processing RSS feed ${rssSubscription.url}:`,
      error
    );
  }
};
