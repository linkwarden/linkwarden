import { Collection, Link, User } from "@prisma/client";
import { prisma } from "../lib/api/db";
import urlHandler from "./lib/urlHandler";

const args = process.argv.slice(2).join(" ");

console.log(process.env.NEXTAUTH_URL);

const archiveTakeCount = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

async function processBatch() {
  const links = await prisma.link.findMany({
    where: {
      OR: [
        {
          collection: {
            owner: {
              archiveAsScreenshot: true,
            },
          },
          screenshotPath: null,
        },
        {
          collection: {
            owner: {
              archiveAsScreenshot: true,
            },
          },
          screenshotPath: "pending",
        },
        ///////////////////////
        {
          collection: {
            owner: {
              archiveAsPDF: true,
            },
          },
          pdfPath: null,
        },
        {
          collection: {
            owner: {
              archiveAsPDF: true,
            },
          },
          pdfPath: "pending",
        },
        ///////////////////////
        {
          readabilityPath: null,
        },
        {
          readabilityPath: "pending",
        },
      ],
    },
    take: archiveTakeCount,
    orderBy: { createdAt: "asc" },
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

      await urlHandler(link);

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
}

const intervalInSeconds = Number(process.env.ARCHIVE_SCRIPT_INTERVAL) || 10;

function delay(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

async function init() {
  console.log("\x1b[34m%s\x1b[0m", "Starting the link processing task");
  while (true) {
    try {
      await processBatch();
      await delay(intervalInSeconds);
    } catch (error) {
      console.error("\x1b[34m%s\x1b[0m", "Error processing links:", error);
      await delay(intervalInSeconds);
    }
  }
}

init();
