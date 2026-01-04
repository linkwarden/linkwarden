import { prisma } from "@linkwarden/prisma";
import { createFolder } from "@linkwarden/filesystem";
import { hasPassedLimit } from "@linkwarden/lib";
import Papa from "papaparse";

type ReadwiseBackup = {
  Title: string;
  URL: string;
  ID: string;
  "Document tags": string;
  "Saved date": string;
  "Reading progress": string;
  Location: string;
  Seen: string;
}[];

function parseReadwiseTags(tagString: string): string[] {
  if (!tagString || tagString.trim() === "") {
    return [];
  }

  // Remove brackets and quotes, split by comma
  const cleaned = tagString.trim().replace(/^\[|\]$/g, "");
  if (!cleaned) {
    return [];
  }

  // Split by comma and clean each tag
  const tags = cleaned.split(",").map((tag) => {
    return tag.trim().replace(/^['"]|['"]$/g, "");
  });

  return tags.filter((tag) => tag.length > 0);
}

export default async function importFromReadwise(
  userId: number,
  rawData: string
) {
  const data = Papa.parse(rawData, {
    header: true,
    skipEmptyLines: true,
  }).data as ReadwiseBackup;

  const backup = data.filter((e) => e.URL);

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
        // Group links by location
        const locationMap = new Map<string, typeof backup>();

        for (const link of backup) {
          const location = link.Location || "new";
          if (!locationMap.has(location)) {
            locationMap.set(location, []);
          }
          locationMap.get(location)!.push(link);
        }

        // Create a collection for each location
        for (const [location, links] of locationMap) {
          const collectionName =
            location.charAt(0).toUpperCase() + location.slice(1);

          const newCollection = await prisma.collection.create({
            data: {
              owner: {
                connect: {
                  id: userId,
                },
              },
              name: `Readwise - ${collectionName}`,
              description: `Imported from Readwise Reader (${location})`,
              createdBy: {
                connect: {
                  id: userId,
                },
              },
            },
          });

          createFolder({ filePath: `archives/${newCollection.id}` });

          for (const link of links) {
            if (link.URL) {
              try {
                new URL(link.URL.trim());
              } catch (err) {
                continue;
              }
            }

            // Parse saved date
            let importDate = null;
            if (link["Saved date"]) {
              try {
                // Handle both formats: "2022-12-20 19:47:00.442000+00:00" and "2022-12-15 00:16:25+00:00"
                const dateStr = link["Saved date"]
                  .replace("+00:00", "")
                  .trim();
                importDate = new Date(dateStr).toISOString();
              } catch (err) {
                importDate = null;
              }
            }

            const tags = parseReadwiseTags(link["Document tags"]);

            await prisma.link.create({
              data: {
                url: link.URL?.slice(0, 2047).trim(),
                name: link.Title?.slice(0, 254).trim() || "",
                importDate,
                collection: {
                  connect: {
                    id: newCollection.id,
                  },
                },
                tags: {
                  connectOrCreate: tags.map((tag) => ({
                    where: {
                      name_ownerId: {
                        name: tag.slice(0, 50).trim(),
                        ownerId: userId,
                      },
                    },
                    create: {
                      name: tag.slice(0, 50).trim(),
                      ownerId: userId,
                    },
                  })),
                },
                createdBy: {
                  connect: {
                    id: userId,
                  },
                },
              },
            });
          }
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
