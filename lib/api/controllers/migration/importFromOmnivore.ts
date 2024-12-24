import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { hasPassedLimit } from "../../verifyCapacity";

type OmnivoreItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  url: string;
  state: string;
  readingProgress: number;
  thumbnail: string;
  labels: string[];
  savedAt: string;
  updatedAt: string;
  publishedAt: string;
};

type OmnivoreMetadata = OmnivoreItem[];

export default async function importFromOmnivore(
  userId: number,
  rawData: string
) {
  const data: OmnivoreMetadata = JSON.parse(rawData);

  const backup = data.filter((item) => !!item.url);

  const totalImports = backup.length;
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
            name: "Omnivore Imports",
            createdBy: {
              connect: {
                id: userId,
              },
            },
          },
        });

        createFolder({ filePath: `archives/${newCollection.id}` });

        for (const item of backup) {
          try {
            new URL(item.url.trim());
          } catch (err) {
            continue;
          }

          await prisma.link.create({
            data: {
              url: item.url?.trim().slice(0, 2047),
              name: item.title?.trim().slice(0, 254) || "",
              description: item.description?.trim().slice(0, 2047) || "",
              image: item.thumbnail || "",
              importDate: item.savedAt ? new Date(item.savedAt) : null,
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

              tags:
                item.labels && item.labels.length > 0
                  ? {
                      connectOrCreate: item.labels.map((label) => ({
                        where: {
                          name_ownerId: {
                            name: label?.trim().slice(0, 49),
                            ownerId: userId,
                          },
                        },
                        create: {
                          name: label?.trim().slice(0, 49),
                          owner: {
                            connect: {
                              id: userId,
                            },
                          },
                        },
                      })),
                    }
                  : undefined,
            },
          });
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => {
      console.error("Error during Omnivore import:", err);
      throw err;
    });

  return { response: "Success.", status: 200 };
}
