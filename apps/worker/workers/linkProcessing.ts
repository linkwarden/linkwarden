import { prisma } from "@linkwarden/prisma";
import archiveHandler from "../lib/archiveHandler";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types";
import getLinkBatch from "../lib/getLinkBatch";
import { delay } from "@linkwarden/lib";

const takeCount = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

export async function startProcessing(interval = 10) {
  console.log("\x1b[34m%s\x1b[0m", "Starting link processing...");
  while (true) {
    const links = await getLinkBatch({
      where: {
        url: { not: null },
        OR: [
          {
            lastPreserved: null,
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
      take: takeCount,
      include: {
        collection: {
          include: {
            owner: true,
          },
        },
        tags: true,
      },
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

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

    const unprocessedLinkCount = await prisma.link.count({
      where: {
        lastPreserved: null,
        url: { not: null },
      },
    });

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${unprocessedLinkCount} left.`
    );

    await delay(interval);
  }
}
