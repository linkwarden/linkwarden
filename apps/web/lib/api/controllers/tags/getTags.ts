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
  const normalizeSearch = (value?: string) => {
    if (!value) return undefined;

    try {
      return decodeURIComponent(value).trim() || undefined;
    } catch {
      return value.trim() || undefined;
    }
  };

  const paginationTakeCount = Number(process.env.PAGINATION_TAKE_COUNT) || 50;
  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");
  const search = normalizeSearch(query.search);
  const searchCondition = search
    ? {
        name: {
          contains: search,
          mode: POSTGRES_IS_ENABLED ? ("insensitive" as const) : undefined,
        },
      }
    : undefined;

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
    const memberCollections = await prisma.usersAndCollections.findMany({
      where: {
        userId,
      },
      select: {
        collectionId: true,
      },
    });

    const memberCollectionIds = memberCollections.map(
      (memberCollection) => memberCollection.collectionId
    );

    const tags = await prisma.tag.findMany({
      take: paginationTakeCount,
      skip: query.cursor ? 1 : undefined,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      where: {
        AND: [
          ...(searchCondition ? [searchCondition] : []),
          {
            OR: [
              { ownerId: userId }, // Tags owned by the user
              ...(memberCollectionIds.length > 0
                ? [
                    {
                      links: {
                        some: {
                          collectionId: {
                            in: memberCollectionIds,
                          },
                        },
                      },
                    },
                  ]
                : []),
            ],
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
        AND: [
          ...(searchCondition ? [searchCondition] : []),
          {
            links: {
              some: {
                collectionId,
              },
            },
          },
        ],
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
