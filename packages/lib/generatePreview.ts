import Jimp from "jimp";
import { prisma } from "@linkwarden/prisma";
import { createFile } from "@linkwarden/filesystem";

export const generatePreview = async (
  buffer: Buffer,
  collectionId: number,
  linkId: number
): Promise<boolean> => {
  if (buffer && collectionId && linkId) {
    try {
      const image = await Jimp.read(buffer);

      if (!image) {
        console.log("Error generating preview: Image not found");
        return false;
      }

      image.resize(1000, Jimp.AUTO).quality(20);
      const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      if (
        Buffer.byteLength(processedBuffer as any) >
        1024 * 1024 * Number(process.env.PREVIEW_MAX_BUFFER || 10)
      ) {
        console.log("Error generating preview: Buffer size exceeded");
        await prisma.link.update({
          where: { id: linkId },
          data: {
            preview: "unavailable",
          },
        });
        return false;
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

      return true;
    } catch (err) {
      console.error("Error processing the image:", err);
    }
  }

  return false;
};
