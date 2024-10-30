import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Order, Sort } from "@/types/global";

export default async function getLink(userId: number, query: LinkRequestQuery) {
  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");

  let order: Order = { id: "desc" };
  if (query.sort === Sort.DateNewestFirst) order = { id: "desc" };
  else if (query.sort === Sort.DateOldestFirst) order = { id: "asc" };
  else if (query.sort === Sort.NameAZ) order = { name: "asc" };
  else if (query.sort === Sort.NameZA) order = { name: "desc" };
  else if (query.sort === Sort.DescriptionAZ) order = { description: "asc" };
  else if (query.sort === Sort.DescriptionZA) order = { description: "desc" };

  const searchConditions = [];

  if (query.searchQueryString) {
    if (query.searchByName) {
      searchConditions.push({
        name: {
          contains: query.searchQueryString,
          mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
        },
      });
    }

    if (query.searchByUrl) {
      searchConditions.push({
        url: {
          contains: query.searchQueryString,
          mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
        },
      });
    }

    if (query.searchByDescription) {
      searchConditions.push({
        description: {
          contains: query.searchQueryString,
          mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
        },
      });
    }

    if (query.searchByTextContent) {
      searchConditions.push({
        textContent: {
          contains: query.searchQueryString,
          mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
        },
      });
    }

    if (query.searchByTags) {
      searchConditions.push({
        tags: {
          some: {
            name: {
              contains: query.searchQueryString,
              mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
            },
            OR: [
              { ownerId: userId },
              {
                links: {
                  some: {
                    collection: {
                      members: {
                        some: { userId },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      });
    }
  }

  const tagCondition = [];

  if (query.tagId) {
    tagCondition.push({
      tags: {
        some: {
          id: query.tagId,
        },
      },
    });
  }

  const collectionCondition = [];

  if (query.collectionId) {
    collectionCondition.push({
      collection: {
        id: query.collectionId,
      },
    });
  }

  const links = await prisma.link.findMany({
    take: Number(process.env.PAGINATION_TAKE_COUNT) || 50,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    where: {
      AND: [
        {
          collection: {
            OR: [
              { ownerId: userId },
              {
                members: {
                  some: { userId },
                },
              },
            ],
          },
        },
        ...collectionCondition,
        {
          OR: [
            ...tagCondition,
            {
              [query.searchQueryString ? "OR" : "AND"]: [
                {
                  pinnedBy: query.pinnedOnly
                    ? { some: { id: userId } }
                    : undefined,
                },
                ...searchConditions,
              ],
            },
          ],
        },
      ],
    },
    include: {
      tags: true,
      collection: true,
      pinnedBy: {
        where: { id: userId },
        select: { id: true },
      },
    },
    orderBy: order,
  });

  return { response: links, status: 200 };
}
