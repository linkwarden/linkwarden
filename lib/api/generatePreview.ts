import Jimp from "jimp";
import { prisma } from "./db";
import createFile from "./storage/createFile";

const generatePreview = async (
  buffer: Buffer,
  collectionId: number,
  linkId: number
) => {
  if (buffer && collectionId && linkId) {
    try {
      const image = await Jimp.read(buffer);

      if (!image) {
        console.log("Error generating preview: Image not found");
        return;
      }

      image.resize(1000, Jimp.AUTO).quality(20);
      const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      if (
        Buffer.byteLength(processedBuffer) >
        1024 * 1024 * Number(process.env.PREVIEW_MAX_BUFFER || 0.1)
      ) {
        console.log("Error generating preview: Buffer size exceeded");
        return prisma.link.update({
          where: { id: linkId },
          data: {
            preview: "unavailable",
          },
        });
      }

      await createFile({
        data: processedBuffer,
        filePath: `archives/preview/${collectionId}/${linkId}.jpeg`,
      });

      await prisma.link.update({
        where: { id: linkId },
        data: {
          preview: `archives/preview/${collectionId}/${linkId}.jpeg`,
        },
      });
    } catch (err) {
      console.error("Error processing the image:", err);
    }
  }
};

export default generatePreview;
