import { Link } from "@prisma/client";
import { prisma } from "../db";
import createFile from "../storage/createFile";

const pdfHandler = async ({ url, id }: Link) => {
  const pdf = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await pdf.arrayBuffer());

  if (
    Buffer.byteLength(buffer) >
    1024 * 1024 * Number(process.env.PDF_MAX_BUFFER || 2)
  )
    return console.log("Error archiving as PDF: Buffer size exceeded");

  const linkExists = await prisma.link.findUnique({
    where: { id },
  });

  if (linkExists) {
    await createFile({
      data: buffer,
      filePath: `archives/${linkExists.collectionId}/${id}.pdf`,
    });

    await prisma.link.update({
      where: { id },
      data: {
        pdf: `archives/${linkExists.collectionId}/${id}.pdf`,
      },
    });
  }
};

export default pdfHandler;
