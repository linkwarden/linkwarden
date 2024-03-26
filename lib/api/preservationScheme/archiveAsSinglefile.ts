import { execSync } from "child_process";
import createFile from "../storage/createFile";
import axios from "axios";
import { Agent } from "http";
import { prisma } from "../db";
import { Link } from "@prisma/client";

const archiveAsSinglefile = async (link: Link) => {
  if (!link.url) return;

  let command = process.env.SINGLEFILE_ARCHIVE_COMMAND;
  let httpApi = process.env.SINGLEFILE_ARCHIVE_HTTP_API;
  if (command) {
    if (command.includes("{{URL}}")) {
      try {
        let html = execSync(command.replace("{{URL}}", link.url), {
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 30,
        });

        if (!html.length) {
          console.error(
            "Error running SINGLEFILE_ARCHIVE_COMMAND: Empty buffer"
          );
          return;
        }

        const collectionId = (
          await prisma.link.findUnique({
            where: { id: link.id },
            select: { collectionId: true },
          })
        )?.collectionId;

        if (!collectionId) {
          console.error(
            "Error running SINGLEFILE_ARCHIVE_COMMAND: Collection ID not found"
          );
          return;
        }

        await createFile({
          data: html,
          filePath: `archives/${collectionId}/${link.id}.html`,
        }).then(async () => {
          await prisma.link.update({
            where: { id: link.id },
            data: {
              singlefile: `archives/${collectionId}/${link.id}.html`,
            },
          });
        });
      } catch (err) {
        console.error("Error running SINGLEFILE_ARCHIVE_COMMAND:", err);
      }
    } else {
      console.error("Invalid SINGLEFILE_ARCHIVE_COMMAND. Missing {{URL}}");
    }
  } else if (httpApi) {
    try {
      let html = await axios.post(
        httpApi,
        { url: link.url },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          httpAgent: new Agent({ keepAlive: false }),
        }
      );

      if (!html.data.length) {
        console.error("Error running SINGLEFILE_ARCHIVE_COMMAND: Empty buffer");
        return;
      }

      const collectionId = (
        await prisma.link.findUnique({
          where: { id: link.id },
          select: { collectionId: true },
        })
      )?.collectionId;

      if (!collectionId) {
        console.error(
          "Error running SINGLEFILE_ARCHIVE_COMMAND: Collection ID not found"
        );
        return;
      }

      await createFile({
        data: html.data,
        filePath: `archives/${collectionId}/${link.id}.html`,
      }).then(async () => {
        await prisma.link.update({
          where: { id: link.id },
          data: {
            singlefile: `archives/${collectionId}/${link.id}.html`,
          },
        });
      });
    } catch (err) {
      console.error(
        "Error fetching Singlefile using SINGLEFILE_ARCHIVE_HTTP_API:",
        err
      );
    }
  }
};

export default archiveAsSinglefile;
