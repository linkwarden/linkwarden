import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, LinkSearchFilter, Sort } from "@/types/global";

export default async function getLink(userId: number, query: LinkRequestQuery) {
  query.sort = Number(query.sort) || 0;
  query.pinnedOnly = query.pinnedOnly
    ? JSON.parse(query.pinnedOnly as unknown as string)
    : undefined;

  if (query.searchFilter) {
    const filterParams = (query.searchFilter as unknown as string).split("-");

    query.searchFilter = {} as LinkSearchFilter;

    query.searchFilter.name = JSON.parse(filterParams[0]);
    query.searchFilter.url = JSON.parse(filterParams[1]);
    query.searchFilter.description = JSON.parse(filterParams[2]);
    query.searchFilter.collection = JSON.parse(filterParams[3]);
    query.searchFilter.tags = JSON.parse(filterParams[4]);
  }

  console.log(query.searchFilter);

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

  const links =
    // Searching logic
    query.searchFilter && query.searchQuery
      ? await prisma.link.findMany({
          take: Number(process.env.PAGINATION_TAKE_COUNT),
          skip: query.cursor !== "undefined" ? 1 : undefined,
          cursor:
            query.cursor !== "undefined"
              ? {
                  id: Number(query.cursor),
                }
              : undefined,
          where: {
            OR: [
              {
                name: {
                  contains: query.searchFilter?.name
                    ? query.searchQuery
                    : undefined,
                  mode: "insensitive",
                },
              },
              {
                url: {
                  contains: query.searchFilter?.url
                    ? query.searchQuery
                    : undefined,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: query.searchFilter?.description
                    ? query.searchQuery
                    : undefined,
                  mode: "insensitive",
                },
              },
              {
                collection: {
                  name: {
                    contains: query.searchFilter?.collection
                      ? query.searchQuery
                      : undefined,
                    mode: "insensitive",
                  },
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
              },
              {
                tags: {
                  // If tagId was defined, search by tag
                  some: {
                    name: {
                      contains: query.searchFilter?.tags
                        ? query.searchQuery
                        : undefined,
                      mode: "insensitive",
                    },
                    OR: [
                      { ownerId: userId }, // Tags owned by the user
                      {
                        links: {
                          some: {
                            name: {
                              contains: query.searchFilter?.tags
                                ? query.searchQuery
                                : undefined,
                              mode: "insensitive",
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
                  },
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
          orderBy: order || undefined,
        })
      : // If not searching
        await prisma.link.findMany({
          take: Number(process.env.PAGINATION_TAKE_COUNT),
          skip: query.cursor !== "undefined" ? 1 : undefined,
          cursor:
            query.cursor !== "undefined"
              ? {
                  id: Number(query.cursor),
                }
              : undefined,
          where: {
            pinnedBy: query.pinnedOnly ? { some: { id: userId } } : undefined,
            collection: {
              id: query.collectionId && Number(query.collectionId), // If collectionId was defined, search by collection

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
            tags: {
              some: query.tagId // If tagId was defined, search by tag
                ? {
                    id: Number(query.tagId),
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
                  }
                : undefined,
            },
          },
          include: {
            tags: true,
            collection: {
              select: {
                id: true,
                ownerId: true,
                name: true,
                color: true,
              },
            },
            pinnedBy: {
              where: { id: userId },
              select: { id: true },
            },
          },
          orderBy: order || undefined,
        });

  return { response: links, status: 200 };
}
