import { prisma } from "@/lib/api/db";

export default async function (collectionId: number) {
  let data;

  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      isPublic: true,
    },
    include: {
      links: {
        select: {
          id: true,
          name: true,
          url: true,
          title: true,
          collectionId: true,
          createdAt: true,
        },
      },
    },
  });

  if (collection) {
    const user = await prisma.user.findUnique({
      where: {
        id: collection.ownerId,
      },
    });

    data = { ownerName: user?.name, ...collection };

    return { response: data, status: 200 };
  } else {
    return { response: "Collection not found...", status: 400 };
  }
}
