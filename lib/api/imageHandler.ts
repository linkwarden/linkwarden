import { prisma } from "@/lib/api/db";
import createFile from "@/lib/api/storage/createFile";
import fs from "fs";
import path from "path";

export default async function imageHandler(
  linkId: number,
  url: string | null,
  extension: string,
  file?: string
) {
  const image = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await image.arrayBuffer());

  const linkExists = await prisma.link.findUnique({
    where: { id: linkId },
  });

  linkExists
    ? await createFile({
        data: buffer,
        filePath: `archives/${linkExists.collectionId}/${linkId}.${extension}`,
      })
    : undefined;

  await prisma.link.update({
    where: { id: linkId },
    data: {
      screenshotPath: linkExists
        ? `archives/${linkExists.collectionId}/${linkId}.${extension}`
        : null,
      pdfPath: null,
      readabilityPath: null,
    },
  });
}
