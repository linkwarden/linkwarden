import { execSync } from "child_process";
import { createFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";
import { Link } from "@prisma/client";

const handleMonolith = async (link: Link, content: string) => {
  if (!link.url) return;

  try {
    let html = execSync(
      `monolith - -I -b "${link.url}" ${
        process.env.MONOLITH_CUSTOM_OPTIONS || "-j -F -q"
      } -o -`,
      {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * Number(process.env.MONOLITH_MAX_BUFFER || 100),
        input: content,
      }
    );

    if (!html?.length)
      return console.error("Error archiving as Monolith: Empty buffer");

    if (
      Buffer.byteLength(html) >
      1024 * 1024 * Number(process.env.MONOLITH_MAX_BUFFER || 6)
    )
      return console.error("Error archiving as Monolith: Buffer size exceeded");

    await createFile({
      data: html,
      filePath: `archives/${link.collectionId}/${link.id}.html`,
    }).then(async () => {
      await prisma.link.update({
        where: { id: link.id },
        data: {
          monolith: `archives/${link.collectionId}/${link.id}.html`,
        },
      });
    });
  } catch (err) {
    console.log("Uncaught Monolith error...");
  }
};

export default handleMonolith;
