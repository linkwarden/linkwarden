import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { hasPassedLimit } from "../../verifyCapacity";
import streamToBlob from "@/lib/shared/streamToBlob";
import JSZip from "jszip";

type OmnivoreMetadata = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author?: string;
  url: string;
  state: string;
  readingProgress: number;
  thumbnail: string;
  labels: string[];
  savedAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}[];

export default async function importFromOmnivore(
  userId: number,
  rawStream: ReadableStream
) {
  const rawData: Blob = await streamToBlob(rawStream);

  const arrayBuffer = await rawData.arrayBuffer();

  const zip = await JSZip.loadAsync(arrayBuffer);

  await prisma.$transaction(async () => {
    const omnivoreCollection = await prisma.collection.create({
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

    createFolder({ filePath: `archives/${omnivoreCollection.id}` });

    for (const filename of Object.keys(zip.files)) {
      if (filename.startsWith("metadata_")) {
        console.log(`Getting metadata from ${filename}`);

        const jsonMetadataString = await zip.files[filename].async("string");
        const metadata: OmnivoreMetadata = JSON.parse(jsonMetadataString);

        const hasTooManyLinks = await hasPassedLimit(userId, metadata.length);
        if (hasTooManyLinks) {
          return {
            response: `Your subscription has reached the maximum number of links allowed.`,
            status: 400,
          };
        }

        for (const data of metadata) {
          try {
            new URL(data.url.trim());
          } catch (err) {
            continue;
          }
          console.log("Extracting text data");
          // const textData = await zip.file(`content/${data.slug}.html`)?.async("string") ?? "";

          await prisma.link.create({
            data: {
              url: data.url.trim(),
              name: data.title.trim().slice(0, 254),
              importDate: data.savedAt,
              description: data.description ? data.description : "",
              //textContent: textData, // TODO maybe we need to cleanup the html
              collection: {
                connect: {
                  id: omnivoreCollection.id,
                },
              },
              createdBy: {
                connect: {
                  id: userId,
                },
              },
              tags:
                data.labels && data.labels[0]
                  ? {
                      connectOrCreate: data.labels.map((label) => ({
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
      }
    }
  });

  return { response: "Success.", status: 200 };
}
