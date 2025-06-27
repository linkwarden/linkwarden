import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import { hasPassedLimit } from "@linkwarden/lib";
import Papa from "papaparse";

type PocketBackup = {
  title: string;
  url: string;
  time_added: string;
  tags: string;
  status: string;
}[];

export default async function importFromPocket(
  userId: number,
  rawData: string
) {
  const data = Papa.parse(rawData, {
    header: true, // Treat first row as header
    skipEmptyLines: true,
  }).data as PocketBackup;

  const backup = data.filter((e) => e.url);

  let totalImports = backup.length;

  const hasTooManyLinks = await hasPassedLimit(userId, totalImports);

  if (hasTooManyLinks) {
    return {
      response: `Your subscription has reached the maximum number of links allowed.`,
      status: 400,
    };
  }

  await prisma
    .$transaction(
      async () => {
        const newCollection = await prisma.collection.create({
          data: {
            owner: {
              connect: {
                id: userId,
              },
            },
            name: "Imports",
            createdBy: {
              connect: {
                id: userId,
              },
            },
          },
        });

        createFolder({ filePath: `archives/${newCollection.id}` });

        for (const link of backup) {
          if (link.url) {
            try {
              new URL(link.url.trim());
            } catch (err) {
              continue;
            }
          }

          await prisma.link.create({
            data: {
              url: link.url?.trim().slice(0, 2047),
              name: link.title?.trim().slice(0, 254) || "",
              importDate: link.time_added
                ? new Date(Number(link.time_added) * 1000).toISOString()
                : null,
              collection: {
                connect: {
                  id: newCollection.id,
                },
              },
              createdBy: {
                connect: {
                  id: userId,
                },
              },
            },
          });
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
