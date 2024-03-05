import "dotenv/config";
import { Collection, Link, User } from "@prisma/client";
import { prisma } from "../lib/api/db";
import archiveHandler from "../lib/api/archiveHandler";

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
          image: "pending",
        },
        ///////////////////////
        {
          pdf: null,
        },
        {
          pdf: "pending",
        },
        ///////////////////////
        {
          readable: null,
        },
        {
          readable: "pending",
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
          image: "pending",
        },
        ///////////////////////
        {
          pdf: null,
        },
        {
          pdf: "pending",
        },
        ///////////////////////
        {
          readable: null,
        },
        {
          readable: "pending",
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
