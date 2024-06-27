import { execSync } from "child_process";
import createFile from "../storage/createFile";
import { prisma } from "../db";
import { Link } from "@prisma/client";

const handleMonolith = async (link: Link, content: string) => {
  if (!link.url) return;

  try {
    let html = execSync(
      `monolith - -I -b ${link.url} ${
        process.env.MONOLITH_OPTIONS || "-j -F -s"
      } -o -`,
      {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * Number(process.env.MONOLITH_MAX_BUFFER || 5),
        input: content,
      }
    );

    if (!html?.length) {
      console.error("Error running SINGLEFILE_ARCHIVE_COMMAND: Empty buffer");
      return;
    }

    await createFile({
      data: html,
      filePath: `archives/${link.collectionId}/${link.id}.html`,
    }).then(async () => {
      await prisma.link.update({
        where: { id: link.id },
        data: {
          singlefile: `archives/${link.collectionId}/${link.id}.html`,
        },
      });
    });
  } catch (err) {
    console.error("Error running SINGLEFILE_ARCHIVE_COMMAND:", err);
  }
};

export default handleMonolith;
