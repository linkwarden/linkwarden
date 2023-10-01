import { prisma } from "@/lib/api/db";
import { Backup } from "@/types/global";
import createFolder from "@/lib/api/storage/createFolder";

export default async function getData(userId: number, rawData: any) {
  const data: Backup = JSON.parse(rawData);

  // Import collections
  try {
    data.collections.forEach(async (e) => {
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
      e.links.forEach(async (e) => {
        const newLink = await prisma.link.create({
          data: {
            url: e.url,
            name: e.name,
            description: e.description,
            collection: {
              connect: {
                id: collectionId,
              },
            },
            tags: {
              connectOrCreate: e.tags.map((tag) => ({
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
      });
    });
  } catch (err) {
    console.log(err);
  }

  return { response: "Success.", status: 200 };
}
