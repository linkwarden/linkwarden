import { Link } from "@prisma/client";
import { prisma } from "../db";
import createFile from "../storage/createFile";
import generatePreview from "../generatePreview";

const imageHandler = async ({ url, id }: Link, extension: string) => {
  const image = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await image.arrayBuffer());

  if (
    Buffer.byteLength(buffer) >
    1024 * 1024 * Number(process.env.SCREENSHOT_MAX_BUFFER || 2)
  )
    return console.log("Error archiving as Screenshot: Buffer size exceeded");

  const linkExists = await prisma.link.findUnique({
    where: { id },
  });

  if (linkExists) {
    await generatePreview(buffer, linkExists.collectionId, id);

    await createFile({
      data: buffer,
      filePath: `archives/${linkExists.collectionId}/${id}.${extension}`,
    });

    await prisma.link.update({
      where: { id },
      data: {
        image: `archives/${linkExists.collectionId}/${id}.${extension}`,
      },
    });
  }
};

export default imageHandler;
