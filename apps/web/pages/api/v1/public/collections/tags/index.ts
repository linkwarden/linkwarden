import getTags from "@/lib/api/controllers/tags/getTags";
import { prisma } from "@linkwarden/prisma";
import { TagRequestQuery } from "@linkwarden/types/global";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const collectionId = req.query.collectionId
      ? Number(req.query.collectionId as string)
      : undefined;
    const convertedData: TagRequestQuery = {
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
    };

    if (!collectionId) {
      return res
        .status(400)
        .json({ response: "Please choose a valid collection." });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        isPublic: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ response: "Collection not found." });
    }

    const tags = await getTags({
      collectionId: collection.id,
      query: convertedData,
    });

    const { statusCode, ...data } = tags;

    return res.status(statusCode).json(data);
  }
}
