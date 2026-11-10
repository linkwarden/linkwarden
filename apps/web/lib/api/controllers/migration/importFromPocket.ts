import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import { hasPassedLimit } from "@linkwarden/lib/verifyCapacity";
import { COLLECTION_ORDER_STEP } from "@linkwarden/lib/linkOrder";
import { shortenText } from "@linkwarden/lib/shortenText";
import oldestFirst from "@/lib/api/oldestFirst";
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

  // Each link is saved on its own rather than inside one transaction, so a
  // link that can't be saved doesn't undo the ones before it, a large import
  // isn't cut off by a transaction timeout, and an instance whose database
  // allows a single connection can still import.
  let added = 0;

  try {
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

    // The collection was just created, so its links can be numbered as they are
    // read instead of asking the database for the top of the list.
    let collectionOrder = COLLECTION_ORDER_STEP;

    for (const link of oldestFirst(backup, (link) =>
      link.time_added ? new Date(Number(link.time_added) * 1000) : null
    )) {
      if (link.url) {
        try {
          new URL(link.url.trim());
        } catch (err) {
          continue;
        }
      }

      await prisma.link.create({
        data: {
          url: shortenText(link.url, 2047)?.trim(),
          name: shortenText(link.title, 254)?.trim() || "",
          importDate: link.time_added
            ? new Date(Number(link.time_added) * 1000).toISOString()
            : null,
          collectionOrder,
          collection: {
            connect: {
              id: newCollection.id,
            },
          },
          tags: {
            connectOrCreate: link?.tags
              ? link.tags.split("|").map((tag) => ({
                  where: {
                    name_ownerId: {
                      name: shortenText(tag, 50)?.trim() || "",
                      ownerId: userId,
                    },
                  },
                  create: {
                    name: shortenText(tag, 50)?.trim() || "",
                    ownerId: userId,
                  },
                }))
              : [],
          },
          createdBy: {
            connect: {
              id: userId,
            },
          },
        },
      });
      added++;
    }
  } catch (error) {
    console.error("Error during Pocket import:", error);

    return {
      response: `The import stopped after adding ${added} of ${totalImports} links.`,
      status: 500,
    };
  }

  return { response: "Success.", status: 200 };
}
