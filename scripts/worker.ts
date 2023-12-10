import { prisma } from "../lib/api/db";
import urlHandler from "./lib/urlHandler";

const args = process.argv.slice(2).join(" ");

const archiveTakeCount = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 1;

// Function to process links for a given user
async function processLinksForUser() {
  // Fetch the first 'maxLinksPerUser' links for the user
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
              archiveAsPDF: true,
            },
          },
          pdfPath: null,
        },
        {
          readabilityPath: null,
        },
      ],
      collection: {
        owner: {
          archiveAsPDF: true,
          archiveAsScreenshot: true,
        },
      },
    },
    take: archiveTakeCount,
    orderBy: { createdAt: "asc" },
    include: {
      collection: true,
    },
  });

  // Process each link using the urlHandler function
  for (const link of links) {
    try {
      console.log(
        `Processing link ${link.id} for user ${link.collection.ownerId}`
      );

      await urlHandler(link.id, link.url || "", link.collection.ownerId);
    } catch (error) {
      console.error(
        `Error processing link ${link.id} for user ${link.collection.ownerId}:`,
        error
      );
    }
  }
}

const intervalInMinutes = 10; // Set the interval for the worker to run

// Main function to iterate over all users and process their links
async function processLinksForAllUsers() {
  console.log("Starting the link processing task");
  try {
    const users = await prisma.user.findMany(); // Fetch all users
    for (const user of users) {
      await processLinksForUser(); // Process links for each user
    }
  } catch (error) {
    console.error("Error processing links for users:", error);
  }
  setTimeout(processLinksForAllUsers, intervalInMinutes * 60000);
}

// Initial run
processLinksForAllUsers();
