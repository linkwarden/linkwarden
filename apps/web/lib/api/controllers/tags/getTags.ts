import { prisma } from "@linkwarden/prisma";
import { TagRequestQuery, TagSort } from "@linkwarden/types/global";

export default async function getTags({
  userId,
  collectionId,
  query = {},
}: {
  userId?: number;
  collectionId?: number;
  query?: TagRequestQuery;
}) {
  const paginationTakeCount = Number(process.env.PAGINATION_TAKE_COUNT) || 50;

  let orderBy: any[] = [{ id: "desc" }];

  if (query.sort === TagSort.DateOldestFirst) orderBy = [{ id: "asc" }];
  else if (query.sort === TagSort.NameAZ)
    orderBy = [{ name: "asc" }, { id: "asc" }];
  else if (query.sort === TagSort.NameZA)
    orderBy = [{ name: "desc" }, { id: "desc" }];
  else if (query.sort === TagSort.LinkCountHighLow)
    orderBy = [{ links: { _count: "desc" } }, { id: "desc" }];
  else if (query.sort === TagSort.LinkCountLowHigh)
    orderBy = [{ links: { _count: "asc" } }, { id: "asc" }];

  if (userId) {
    const tags = await prisma.tag.findMany({
      take: paginationTakeCount,
      skip: query.cursor ? 1 : undefined,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      where: {
        OR: [
          { ownerId: userId }, // Tags owned by the user
          {
            links: {
              some: {
                collection: {
                  members: {
                    some: {
                      userId, // Tags from collections where the user is a member
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { links: true },
        },
      },
      orderBy,
    });

    return {
      data: {
        tags,
        nextCursor:
          tags.length === paginationTakeCount ? tags[tags.length - 1].id : null,
      },
      statusCode: 200,
      success: true,
      message: "Success",
    };
  } else if (collectionId) {
    const tags = await prisma.tag.findMany({
      where: {
        links: {
          some: {
            collection: {
              id: collectionId,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            links: true,
          },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });

    return {
      data: {
        tags,
      },
      statusCode: 200,
      success: true,
      message: "Success",
    };
  }

  return {
    data: { tags: [] },
    statusCode: 400,
    success: false,
    message: "Please choose a valid user or collection.",
  };
}
