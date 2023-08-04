import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Sort } from "@/types/global";

export default async function getLink(userId: number, body: string) {
  const query: LinkRequestQuery = JSON.parse(decodeURIComponent(body));
  console.log(query);

  // Sorting logic
  let order: any;
  if (query.sort === Sort.DateNewestFirst)
    order = {
      createdAt: "desc",
    };
  else if (query.sort === Sort.DateOldestFirst)
    order = {
      createdAt: "asc",
    };
  else if (query.sort === Sort.NameAZ)
    order = {
      name: "asc",
    };
  else if (query.sort === Sort.NameZA)
    order = {
      name: "desc",
    };
  else if (query.sort === Sort.DescriptionAZ)
    order = {
      name: "asc",
    };
  else if (query.sort === Sort.DescriptionZA)
    order = {
      name: "desc",
    };

  const links = await prisma.link.findMany({
    take: Number(process.env.PAGINATION_TAKE_COUNT) || 20,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor
      ? {
          id: query.cursor,
        }
      : undefined,
    where: {
      collection: {
        id: query.collectionId ? query.collectionId : undefined, // If collectionId was defined, filter by collection
        OR: [
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      [query.searchQuery ? "OR" : "AND"]: [
        {
          pinnedBy: query.pinnedOnly ? { some: { id: userId } } : undefined,
        },
        {
          name: {
            contains:
              query.searchQuery && query.searchFilter?.name
                ? query.searchQuery
                : undefined,
          },
        },
        {
          url: {
            contains:
              query.searchQuery && query.searchFilter?.url
                ? query.searchQuery
                : undefined,
          },
        },
        {
          description: {
            contains:
              query.searchQuery && query.searchFilter?.description
                ? query.searchQuery
                : undefined,
          },
        },
        {
          tags:
            query.searchQuery && !query.searchFilter?.tags
              ? undefined
              : {
                  some: query.tagId
                    ? {
                        // If tagId was defined, filter by tag
                        id: query.tagId,
                        name:
                          query.searchQuery && query.searchFilter?.tags
                            ? {
                                contains: query.searchQuery,
                              }
                            : undefined,
                        OR: [
                          { ownerId: userId }, // Tags owned by the user
                          {
                            links: {
                              some: {
                                name: {
                                  contains:
                                    query.searchQuery &&
                                    query.searchFilter?.tags
                                      ? query.searchQuery
                                      : undefined,
                                },
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
                      }
                    : undefined,
                },
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
    orderBy: order || {
      createdAt: "desc",
    },
  });

  return { response: links, status: 200 };
}
