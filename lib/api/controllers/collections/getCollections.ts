import { prisma } from "@/lib/api/db";

export default async function (userId: number) {
  const collections = await prisma.collection.findMany({
    where: {
      ownerId: userId,
    },
  });

  return { response: collections, status: 200 };
}
