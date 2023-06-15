import { prisma } from "@/lib/api/db";
import { PublicLinkRequestQuery } from "@/types/global";

export default async function getCollection(body: string) {
  const query: PublicLinkRequestQuery = JSON.parse(decodeURIComponent(body));
  console.log(query);

  let data;

  const collection = await prisma.collection.findFirst({
    where: {
      id: Number(query.collectionId),
      isPublic: true,
    },
  });

  if (collection) {
    const links = await prisma.link.findMany({
      take: Number(process.env.PAGINATION_TAKE_COUNT),
      skip: query.cursor ? 1 : undefined,
      cursor: query.cursor
        ? {
            id: Number(query.cursor),
          }
        : undefined,
      where: {
        collection: {
          id: Number(query.collectionId),
        },
      },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    data = { ...collection, links: [...links] };

    return { response: data, status: 200 };
  } else {
    return { response: "Collection not found...", status: 400 };
  }
}
