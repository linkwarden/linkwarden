import { prisma } from "@/lib/api/db";
import { Backup } from "@/types/global";
import createFolder from "@/lib/api/storage/createFolder";

const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER) || 30000;

export default async function importFromLinkwarden(
  userId: number,
  rawData: string
) {
  const data: Backup = JSON.parse(rawData);

  let totalImports = 0;

  data.collections.forEach((collection) => {
    totalImports += collection.links.length;
  });

  const numberOfLinksTheUserHas = await prisma.link.count({
    where: {
      collection: {
        ownerId: userId,
      },
    },
  });

  if (totalImports + numberOfLinksTheUserHas > MAX_LINKS_PER_USER)
    return {
      response: `Error: Each user can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      status: 400,
    };

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
              name: e.name,
              description: e.description,
              color: e.color,
            },
          });

          createFolder({ filePath: `archives/${newCollection.id}` });

          // Import Links
          for (const link of e.links) {
            const newLink = await prisma.link.create({
              data: {
                url: link.url,
                name: link.name,
                description: link.description,
                collection: {
                  connect: {
                    id: newCollection.id,
                  },
                },
                // Import Tags
                tags: {
                  connectOrCreate: link.tags.map((tag) => ({
                    where: {
                      name_ownerId: {
                        name: tag.name.trim(),
                        ownerId: userId,
                      },
                    },
                    create: {
                      name: tag.name.trim(),
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
          }
        }
      },
      { timeout: 30000 }
    )
    .catch((err) => console.log(err));

  return { response: "Success.", status: 200 };
}
