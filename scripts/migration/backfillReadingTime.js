// Run the script with `node scripts/migration/v2.6.1/index.js`
// Docker users can run the script with `docker exec -it CONTAINER_ID /bin/bash -c 'node scripts/migration/v2.6.1/index.js'`

// There are two parts to this script:

// Firstly we decided that the "name" field should be the auto-generated field instead of the "description" field, so we need to
// move the data from the "description" field to the "name" field for links that have an empty name.

// Secondly it looks for every link and checks if the pdf/screenshot exist in the filesystem.
// If they do, it updates the link with the path in the db.
// If they don't, it passes.

const { PrismaClient } = require("@prisma/client");
const { readingTime } = require("reading-time-estimator");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting... Please do not interrupt the process.");

  const linksWithoutReadingTime = await prisma.link.findMany({
    where: {
      readingTime: null,
      textContent: { not: null },
    },
    select: {
      id: true,
      textContent: true,
    },
  });

  for (const link of linksWithoutReadingTime) {
    await prisma.link.update({
      where: {
        id: link.id,
      },
      data: {
        readingTime: readingTime(link.textContent).minutes,
      },
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
