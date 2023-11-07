import { prisma } from "@/lib/api/db";
import { Backup } from "@/types/global";
import createFolder from "@/lib/api/storage/createFolder";

export default async function getData(userId: number, rawData: string) {
  const data: Backup = JSON.parse(rawData);

  await prisma
    .$transaction(
      async () => {
        // Import collections
        for (const e of data.collections) {
          e.name = e.name.trim();

          const findCollection = await prisma.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              collections: {
                where: {
                  name: e.name,
                },
              },
            },
          });

          const checkIfCollectionExists = findCollection?.collections[0];

          let collectionId = findCollection?.collections[0]?.id;

          if (!checkIfCollectionExists) {
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

            collectionId = newCollection.id;
          }

          // Import Links
          for (const link of e.links) {
            const newLink = await prisma.link.create({
              data: {
                url: link.url,
                name: link.name,
                description: link.description,
                collection: {
                  connect: {
                    id: collectionId,
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
