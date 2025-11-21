import { prisma } from "@linkwarden/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { paginate } from "@/lib/api/utils/pagination";
import { TagPaginationParams } from "@/lib/api/utils/types";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const collectionId = req.query.collectionId
      ? Number(req.query.collectionId as string)
      : undefined;

    if (!collectionId) {
      return res
        .status(400)
        .json({ response: "Please choose a valid collection." });
    }

    // Verify collection is public
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        isPublic: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ response: "Collection not found." });
    }

    // Parse pagination parameters
    const params: TagPaginationParams = {
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
      limit: req.query.limit ? Number(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
      dir: req.query.dir as string,
      search: req.query.search as string,
      collectionId: collection.id,
    };

    const POSTGRES_IS_ENABLED =
      process.env.DATABASE_URL?.startsWith("postgresql");

    // Build where clause for public collection tags
    const whereClause: any = {
      links: {
        some: {
          collection: {
            id: collection.id,
          },
        },
      },
    };

    // Add search filter if provided
    if (params.search) {
      whereClause.name = {
        contains: params.search,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      };
    }

    // Get paginated tags
    const response = await paginate(
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
        });
      },
      {
        defaultLimit: 50,
        maxLimit: 100,
        allowedSortColumns: ["name", "id", "createdAt"],
        defaultSort: [{ name: "asc" }],
      }
    );

    return res.status(200).json({ success: true, response });
  }
}
