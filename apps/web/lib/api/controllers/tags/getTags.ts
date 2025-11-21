import { prisma } from "@linkwarden/prisma";
import { paginate } from "../../utils/pagination";
import { TagPaginationParams } from "../../utils/types";

export default async function getTags(params: TagPaginationParams) {
  const { userId, collectionId } = params;

  if (!userId) {
    // userId is required
    return { response: [], status: 400 };
  }

  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");

  // Build where clause
  const whereClause: any = {
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
  };

  // Add search filter if provided
  if (params.search) {
    whereClause.name = {
      contains: params.search,
      mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
    };
  }

  // Add collection filter if provided
  if (collectionId) {
    whereClause.links = {
      some: {
        collection: {
          id: collectionId,
        },
      },
    };
  }

  // Get total count for the where clause
  const total = await prisma.tag.count({ where: whereClause });

  // Use pagination utility
  const paginatedData = await paginate(
    params,
    async (pagination) => {
      return await prisma.tag.findMany({
        ...pagination,
        where: whereClause,
        include: {
          _count: {
            select: { links: true },
          },
        },
        // NOTE: Sorting by links._count is commented out due to Prisma bug
        // See doc/instructions/get-tags-sorting-issue.md for details
        // When combined with complex WHERE clauses (like OR above), Prisma
        // fails to correctly order by relation count.
        // orderBy: {
        //   links: {
        //     _count: "desc",
        //   },
        // },
      });
    },
    {
      defaultLimit: 50,
      maxLimit: 100,
      allowedSortColumns: ["name", "id", "createdAt"],
      defaultSort: [{ name: "asc" }],
    }
  );

  // Add total count to the response
  const response = {
    ...paginatedData,
    total,
  };

  return { response, status: 200 };
}
