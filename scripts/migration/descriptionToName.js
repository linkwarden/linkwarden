// [Optional, but recommended]

// We decided that the "name" field should be the auto-generated field instead of the "description" field, so we need to
// move the data from the "description" field to the "name" field for links that have an empty name.

// This script is meant to be run only once.

// Run the script with `node scripts/migration/descriptionToName.js`

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting...");

  const count = await prisma.link.count({
    where: {
      name: "",
      description: {
        not: "",
      },
    },
  });

  console.log(
    `Applying the changes to ${count} ${
      count == 1 ? "link" : "links"
    } in 10 seconds...`
  );

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("Applying the changes...");

  const links = await prisma.link.findMany({
    where: {
      name: "",
      description: {
        not: "",
      },
    },
    select: {
      id: true,
      description: true,
    },
  });

  for (const link of links) {
    await prisma.link.update({
      where: {
        id: link.id,
      },
      data: {
        name: link.description,
        description: "",
      },
    });
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
