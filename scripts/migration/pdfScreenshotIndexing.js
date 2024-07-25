// This is a script that looks for every link and checks if the pdf/screenshot exist in the filesystem.
// If they do, it updates the link with the path in the db.
// If they don't, it passes.

const { S3 } = require("@aws-sdk/client-s3");
const { PrismaClient } = require("@prisma/client");
const { existsSync } = require("fs");
const util = require("util");

const prisma = new PrismaClient();

const STORAGE_FOLDER = process.env.STORAGE_FOLDER || "data";

const s3Client =
  process.env.SPACES_ENDPOINT &&
  process.env.SPACES_REGION &&
  process.env.SPACES_KEY &&
  process.env.SPACES_SECRET
    ? new S3({
        forcePathStyle: false,
        endpoint: process.env.SPACES_ENDPOINT,
        region: process.env.SPACES_REGION,
        credentials: {
          accessKeyId: process.env.SPACES_KEY,
          secretAccessKey: process.env.SPACES_SECRET,
        },
      })
    : undefined;

async function checkFileExistence(path) {
  if (s3Client) {
    // One millisecond delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1));

    const bucketParams = {
      Bucket: process.env.SPACES_BUCKET_NAME,
      Key: path,
    };

    try {
      const headObjectAsync = util.promisify(
        s3Client.headObject.bind(s3Client)
      );

      try {
        await headObjectAsync(bucketParams);
        return true;
      } catch (err) {
        return false;
      }
    } catch (err) {
      console.log("Error:", err);

      return false;
    }
  } else {
    try {
      if (existsSync(STORAGE_FOLDER + "/" + path)) {
        return true;
      } else return false;
    } catch (err) {
      console.log(err);
    }
  }
}

async function pdfScreenshotIndexing() {
  const links = await prisma.link.findMany({
    select: {
      id: true,
      collectionId: true,
      image: true,
      pdf: true,
      readable: true,
      monolith: true,
    },
    orderBy: { id: "asc" },
  });

  // PDFs
  for (let link of links) {
    const path = `archives/${link.collectionId}/${link.id}.pdf`;

    const res = await checkFileExistence(path);

    if (res) {
      await prisma.link.update({
        where: { id: link.id },
        data: { pdf: path },
      });
      console.log(`${link.id}`);
    } else {
      console.log(`${link.id}`);
    }
  }

  // Screenshots (PNGs)
  for (let link of links) {
    const path = `archives/${link.collectionId}/${link.id}.png`;

    const res = await checkFileExistence(path);

    if (res) {
      await prisma.link.update({
        where: { id: link.id },
        data: { image: path },
      });
      console.log(`${link.id}`);
    } else {
      console.log(`${link.id}`);
    }
  }

  // Screenshots (JPEGs)
  for (let link of links) {
    const path = `archives/${link.collectionId}/${link.id}.jpeg`;

    const res = await checkFileExistence(path);

    if (res) {
      await prisma.link.update({
        where: { id: link.id },
        data: { image: path },
      });
      console.log(`${link.id}`);
    } else {
      console.log(`${link.id}`);
    }
  }

  await prisma.$disconnect();
}

pdfScreenshotIndexing().catch((e) => {
  console.error(e);
  process.exit(1);
});
