import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Order, Sort } from "@/types/global";
import { meiliClient } from "../../meilisearchClient";
import {
  buildMeiliFilters,
  buildMeiliQuery,
  parseSearchTokens,
} from "../../searchQueryBuilder";

export default async function searchLinks(
  userId: number,
  query: LinkRequestQuery
) {
  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");

  const paginationTakeCount = Number(process.env.PAGINATION_TAKE_COUNT) || 50;

  let order: Order = { id: "desc" };
  if (query.sort === Sort.DateNewestFirst) order = { id: "desc" };
  else if (query.sort === Sort.DateOldestFirst) order = { id: "asc" };
  else if (query.sort === Sort.NameAZ) order = { name: "asc" };
  else if (query.sort === Sort.NameZA) order = { name: "desc" };

  const tagCondition = [];
  if (query.tagId) {
    tagCondition.push({
      tags: {
        some: { id: query.tagId },
      },
    });
  }

  const collectionCondition = [];
  if (query.collectionId) {
    collectionCondition.push({
      collection: { id: query.collectionId },
    });
  }

  const pinnedCondition = query.pinnedOnly
    ? { pinnedBy: { some: { id: userId } } }
    : {};

  if (meiliClient && query.searchQueryString) {
    const tokens = parseSearchTokens(query.searchQueryString);
    const meiliQuery = buildMeiliQuery(tokens);

    const meiliFilters = buildMeiliFilters(tokens, userId);

    const limit = paginationTakeCount;
    const offset = query.cursor || 0;

    const meiliResp = await meiliClient.index("links").search(meiliQuery, {
      filter: meiliFilters,
      attributesToRetrieve: ["id"],
      limit,
      offset,
      sort:
        query.sort === Sort.DateNewestFirst
          ? ["id:desc"]
          : query.sort === Sort.DateOldestFirst
            ? ["id:asc"]
            : query.sort === Sort.NameAZ
              ? ["name:asc"]
              : query.sort === Sort.NameZA
                ? ["name:desc"]
                : ["id:desc"],
    });

    if (meiliResp.hits.length === 0) {
      return {
        data: [],
        statusCode: 200,
        success: true,
        message: "Nothing found.",
      };
    }

    const meiliIds = meiliResp.hits.map((h: any) => h.id);

    const links = await prisma.link.findMany({
      where: {
        id: { in: meiliIds },
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
                ...pinnedCondition,
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

    const nextCursor = meiliResp.hits.length === limit ? offset + limit : null;

    return {
      data: {
        links,
        nextCursor,
      },
      statusCode: 200,
      success: true,
      message: "Success",
    };
  }

  // Fallback: No Meilisearch
  const searchConditions = [];

  if (query.searchQueryString) {
    searchConditions.push({
      name: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      url: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      description: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

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

  const links = await prisma.link.findMany({
    take: paginationTakeCount,
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
                pinnedCondition,
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

  return {
    data: {
      links,
      nextCursor:
        links.length === paginationTakeCount
          ? links[links.length - 1].id
          : null,
    },
    statusCode: 200,
    success: true,
    message: "Success",
  };
}
