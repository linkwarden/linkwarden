const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const { existsSync } = require("fs");

const prisma = new PrismaClient();

const STORAGE_FOLDER = process.env.STORAGE_FOLDER || "data";

async function checkFileExistence(path) {
  try {
    if (existsSync(path)) {
      return true;
    } else return false;
  } catch (err) {
    console.log(err);
  }
}

// Avatars
async function migrateAvatars() {
  const users = await prisma.user.findMany();

  for (let user of users) {
    const path = STORAGE_FOLDER + `/uploads/avatar/${user.id}.jpg`;

    const res = await checkFileExistence(path);

    if (res) {
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { image: "avatar/" + user.id },
      // });
      console.log(`Updated avatar for user ${user.id}`);
    } else {
      console.log(`No avatar found for user ${user.id}`);
    }
  }

  const links = await prisma.link.findMany();

  // Screenshots
  for (let link of links) {
    const path =
      STORAGE_FOLDER + `/archives/${link.collectionId}/${link.id}.pdf`;

    const res = await checkFileExistence(path);

    if (res) {
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { image: "avatar/" + user.id },
      // });
      console.log(`Updated capture for link ${link.id}`);
    } else {
      console.log(`No capture found for link ${link.id}`);
    }
  }

  // PDFs
  for (let link of links) {
    const path =
      STORAGE_FOLDER + `/archives/${link.collectionId}/${link.id}.png`;

    const res = await checkFileExistence(path);

    if (res) {
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { image: "avatar/" + user.id },
      // });
      console.log(`Updated capture for link ${link.id}`);
    } else {
      console.log(`No capture found for link ${link.id}`);
    }
  }

  await prisma.$disconnect();
}

migrateAvatars().catch((e) => {
  console.error(e);
  process.exit(1);
});
