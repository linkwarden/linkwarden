import Jimp from "jimp";
import sharp from "sharp";
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
      image.resize(1000, Jimp.AUTO).quality(20);
      const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      if (Buffer.byteLength(processedBuffer as any) > 1024 * 1024 * Number(process.env.PREVIEW_MAX_BUFFER || 10)) {
        await prisma.link.update({ where: { id: linkId }, data: { preview: "unavailable" } });
        return false;
      }

      await createFile({
        data: processedBuffer,
        filePath: `archives/preview/${collectionId}/${linkId}.jpeg`,
      });

      await prisma.link.update({
        where: { id: linkId },
        data: { preview: `archives/preview/${collectionId}/${linkId}.jpeg` },
      });

      return true;
    } catch (error: any) {
      if (error.message?.includes("Unsupported MIME type")) {
        console.warn(`[Image Processing] Unsupported format (${error.message.split(' ')[3]}). Attempting conversion with sharp...`);
        try {
          const pngBuffer = await sharp(buffer).png().toBuffer();
          const image = await Jimp.read(pngBuffer);
          image.resize(1000, Jimp.AUTO).quality(20);
          const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

          if (Buffer.byteLength(processedBuffer as any) > 1024 * 1024 * Number(process.env.PREVIEW_MAX_BUFFER || 10)) {
             await prisma.link.update({ where: { id: linkId }, data: { preview: "unavailable" } });
             return false;
          }

          await createFile({
            data: processedBuffer,
            filePath: `archives/preview/${collectionId}/${linkId}.jpeg`,
          });

          await prisma.link.update({
            where: { id: linkId },
            data: { preview: `archives/preview/${collectionId}/${linkId}.jpeg` },
          });

          return true;
        } catch (sharpError) {
          console.error('[Image Processing] Sharp conversion also failed.', sharpError);
          return false;
        }
      }
      console.error("Error processing the image:", error);
      return false;
    }
  }
  return false;
};
