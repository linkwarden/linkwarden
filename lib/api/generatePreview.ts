import Jimp from "jimp";
import { prisma } from "./db";
import createFile from "./storage/createFile";
import createFolder from "./storage/createFolder";

const generatePreview = async (
  buffer: Buffer,
  collectionId: number,
  linkId: number
) => {
  if (buffer && collectionId && linkId) {
    // Load the image using Jimp
    await Jimp.read(buffer, async (err, image) => {
      if (image && !err) {
        image?.resize(1280, Jimp.AUTO).quality(20);
        const processedBuffer = await image?.getBufferAsync(Jimp.MIME_JPEG);

        createFile({
          data: processedBuffer,
          filePath: `archives/preview/${collectionId}/${linkId}.jpeg`,
        }).then(() => {
          return prisma.link.update({
            where: { id: linkId },
            data: {
              preview: `archives/preview/${collectionId}/${linkId}.jpeg`,
            },
          });
        });
      }
    }).catch((err) => {
      console.error("Error processing the image:", err);
    });
  }
};

export default generatePreview;
