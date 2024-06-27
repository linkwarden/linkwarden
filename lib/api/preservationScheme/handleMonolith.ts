import { execSync } from "child_process";
import createFile from "../storage/createFile";
import axios from "axios";
import { Agent } from "http";
import { prisma } from "../db";
import { Link } from "@prisma/client";
import { Page } from "playwright";

const handleMonolith = async (link: Link, content: string) => {
  if (!link.url) return;

  let command = process.env.SINGLEFILE_ARCHIVE_COMMAND;
  let httpApi = process.env.SINGLEFILE_ARCHIVE_HTTP_API;
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
  // if (httpApi) {
  //   try {
  //     let html = await axios.post(
  //       httpApi,
  //       { url: link.url },
  //       {
  //         headers: {
  //           "Content-Type": "application/x-www-form-urlencoded",
  //         },
  //         httpAgent: new Agent({ keepAlive: false }),
  //       }
  //     );

  //     if (!html.data.length) {
  //       console.error("Error running SINGLEFILE_ARCHIVE_COMMAND: Empty buffer");
  //       return;
  //     }

  //     const collectionId = (
  //       await prisma.link.findUnique({
  //         where: { id: link.id },
  //         select: { collectionId: true },
  //       })
  //     )?.collectionId;

  //     if (!collectionId) {
  //       console.error(
  //         "Error running SINGLEFILE_ARCHIVE_COMMAND: Collection ID not found"
  //       );
  //       return;
  //     }

  //     await createFile({
  //       data: html.data,
  //       filePath: `archives/${collectionId}/${link.id}.html`,
  //     }).then(async () => {
  //       await prisma.link.update({
  //         where: { id: link.id },
  //         data: {
  //           singlefile: `archives/${collectionId}/${link.id}.html`,
  //         },
  //       });
  //     });
  //   } catch (err) {
  //     console.error(
  //       "Error fetching Singlefile using SINGLEFILE_ARCHIVE_HTTP_API:",
  //       err
  //     );
  //   }
  // }
};

export default handleMonolith;
