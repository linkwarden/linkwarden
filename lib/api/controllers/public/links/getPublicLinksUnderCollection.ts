import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Order, Sort } from "@/types/global";

export default async function getLink(
  query: Omit<LinkRequestQuery, "tagId" | "pinnedOnly">
) {
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
          },
        },
      });
    }
  }

  const links = await prisma.link.findMany({
    take: Number(process.env.PAGINATION_TAKE_COUNT) || 50,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    where: {
      collection: {
        id: query.collectionId,
        isPublic: true,
      },
      [query.searchQueryString ? "OR" : "AND"]: [...searchConditions],
    },
    include: {
      tags: true,
    },
    orderBy: order || { id: "desc" },
  });

  return { response: links, status: 200 };
}
