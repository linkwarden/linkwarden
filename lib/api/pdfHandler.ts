import { prisma } from "@/lib/api/db";
import createFile from "@/lib/api/storage/createFile";
import fs from "fs";
import path from "path";

export default async function pdfHandler(
  linkId: number,
  url: string | null,
  file?: string
) {
  const targetLink = await prisma.link.update({
    where: { id: linkId },
    data: {
      pdfPath: "pending",
      lastPreserved: new Date().toISOString(),
    },
  });

  const pdf = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await pdf.arrayBuffer());

  const linkExists = await prisma.link.findUnique({
    where: { id: linkId },
  });

  linkExists
    ? await createFile({
        data: buffer,
        filePath: `archives/${linkExists.collectionId}/${linkId}.pdf`,
      })
    : undefined;

  await prisma.link.update({
    where: { id: linkId },
    data: {
      pdfPath: linkExists
        ? `archives/${linkExists.collectionId}/${linkId}.pdf`
        : null,
      readabilityPath: null,
      screenshotPath: null,
    },
  });
}
