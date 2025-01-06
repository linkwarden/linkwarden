import { prisma } from "@/lib/api/db";
import { Backup } from "@/types/global";
import createFolder from "@/lib/api/storage/createFolder";
import { hasPassedLimit } from "../../verifyCapacity";

export default async function importFromLinkwarden(
  userId: number,
  rawData: string
) {
  const data: Backup = JSON.parse(rawData);

  let totalImports = 0;

  data.collections.forEach((collection) => {
    totalImports += collection.links.length;
  });

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
        // Import collections
        for (const e of data.collections) {
          e.name = e.name.trim();

          const newCollection = await prisma.collection.create({
            data: {
              owner: {
                connect: {
                  id: userId,
                },
              },
              name: e.name?.trim().slice(0, 254),
              description: e.description?.trim().slice(0, 254),
              color: e.color?.trim().slice(0, 50),
              createdBy: {
                connect: {
                  id: userId,
                },
              },
            },
          });

          createFolder({ filePath: `archives/${newCollection.id}` });

          // Import Links
          for (const link of e.links) {
            if (link.url) {
              try {
                new URL(link.url.trim());
              } catch (err) {
                continue;
              }
            }

            const newLink = await prisma.link.create({
              data: {
                url: link.url?.trim().slice(0, 2047),
                name: link.name?.trim().slice(0, 254),
                description: link.description?.trim().slice(0, 254),
                importDate: new Date(link.importDate || link.createdAt),
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
                // Import Tags
                tags: {
                  connectOrCreate: link.tags.map((tag) => ({
                    where: {
                      name_ownerId: {
                        name: tag.name?.slice(0, 49),
                        ownerId: userId,
                      },
                    },
                    create: {
                      name: tag.name?.trim().slice(0, 49),
                      owner: {
                        connect: {
                          id: userId,
                        },
                      },
                    },
                  })),
                },
              },
            });
            // Import pinnedLinks
            data?.pinnedLinks.forEach(async (pinnedLink) => {
              if (pinnedLink.url === newLink.url) {
                await prisma.link.update({
                  where: {
                    id: newLink.id,
                  },
                  data: {
                    pinnedBy: { connect: { id: userId } },
                  },
                });
              }
            });
          }
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
