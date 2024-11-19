import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";
import { parse, Node, Element, TextNode } from "himalaya";
import { hasPassedLimit } from "../../verifyCapacity";
import { ZipReader, BlobReader, TextWriter } from "@zip.js/zip.js";
import { Readable } from 'stream';
import streamToBlob from "stream-to-blob";

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
}[]

export default async function importFromOmnivore(
    userId: number,
    rawStream: Readable
) {
    const rawData: Blob = await streamToBlob(rawStream);
    const zipFileReader = new BlobReader(rawData);
    const importArchive = new ZipReader(zipFileReader);

    const zipEntries = await importArchive.getEntries();

    await prisma.$transaction(
        async () => {
            const omnivoreCollection = await prisma.collection.create({
                data: {
                    owner: {
                        connect: {
                            id: userId
                        }
                    },
                    name: "Omnivore Imports",
                    createdBy: {
                        connect: {
                            id: userId
                        }
                    }
                }
            });

            createFolder({ filePath: `archives/${omnivoreCollection.id}` });

            for (const entry of zipEntries) {

                if (entry.filename.startsWith("metadata_")) {
                    console.log(`Getting metadata from ${entry.filename}`);

                    const jsonWriter = new TextWriter();
                    const jsonMetadatString: string = await entry.getData(jsonWriter);
                    const metadata: OmnivoreMetadata = JSON.parse(jsonMetadatString);

                    const hasTooManyLinks = await hasPassedLimit(userId, metadata.length);
                    if (hasTooManyLinks) {
                        return {
                            response: `Your subscription have reached the maximum number of links allowed.`,
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
                        //const textData = await importArchive.get(`content/${data.slug}.html`)?.get_string()

                        await prisma.link.create(
                            {
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
                                    tags: data.labels && data.labels[0]
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
                                }
                            }
                        )
                    }
                }
            }
        }
    );
    return { response: "Success.", status: 200 };
}
