import { prisma } from "@/lib/api/db";
import { existsSync, mkdirSync } from "fs";

export default async function (collectionName: string, userId: number) {
  if (!collectionName)
    return {
      response: "Please enter a valid name for the collection.",
      status: 400,
    };

  const findCollection = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      collections: {
        where: {
          name: collectionName,
        },
      },
    },
  });

  const checkIfCollectionExists = findCollection?.collections[0];

  if (checkIfCollectionExists)
    return { response: "Collection already exists.", status: 400 };

  const newCollection = await prisma.collection.create({
    data: {
      owner: {
        connect: {
          id: userId,
        },
      },
      name: collectionName,
    },
  });

  const collectionPath = `data/archives/${newCollection.id}`;
  if (!existsSync(collectionPath))
    mkdirSync(collectionPath, { recursive: true });

  return { response: newCollection, status: 200 };
}
