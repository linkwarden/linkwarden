import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

type WallabagBackup = {
  is_archived: number;
  is_starred: number;
  tags: String[];
  is_public: boolean;
  id: number;
  title: string;
  url: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  published_by: string[];
  starred_at: Date;
  annotations: any[];
  mimetype: string;
  language: string;
  reading_time: number;
  domain_name: string;
  preview_picture: string;
  http_status: string;
  headers: Record<string, string>;
}[];

export default async function importFromWallabag(
  userId: number,
  rawData: string
) {
  const data: WallabagBackup = JSON.parse(rawData);

  const backup = data.filter((e) => e.url);

  let totalImports = backup.length;

  const numberOfLinksTheUserHas = await prisma.link.count({
    where: {
      collection: {
        ownerId: userId,
      },
    },
  });

  if (totalImports + numberOfLinksTheUserHas > MAX_LINKS_PER_USER)
    return {
      response: `Each collection owner can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      status: 400,
    };

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
              pinnedBy: link.is_starred
                ? { connect: { id: userId } }
                : undefined,
              url: link.url?.trim().slice(0, 254),
              name: link.title?.trim().slice(0, 254) || "",
              textContent: link.content?.trim() || "",
              importDate: link.created_at || null,
              collection: {
                connect: {
                  id: newCollection.id,
                },
              },
              tags:
                link.tags && link.tags[0]
                  ? {
                      connectOrCreate: link.tags.map((tag) => ({
                        where: {
                          name_ownerId: {
                            name: tag?.trim().slice(0, 49),
                            ownerId: userId,
                          },
                        },
                        create: {
                          name: tag?.trim().slice(0, 49),
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
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
