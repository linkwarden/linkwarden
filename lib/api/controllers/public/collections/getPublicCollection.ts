import { prisma } from "@/lib/api/db";

export default async function getPublicCollection(id: number) {
  const collection = await prisma.collection.findFirst({
    where: {
      id,
      isPublic: true,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              username: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: { links: true },
      },
    },
  });

  if (collection) {
    return { response: collection, status: 200 };
  } else {
    return { response: "Collection not found.", status: 400 };
  }
}
