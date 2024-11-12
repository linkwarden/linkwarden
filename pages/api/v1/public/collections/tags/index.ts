import getTags from "@/lib/api/controllers/tags/getTags";
import { prisma } from "@/lib/api/db";
import { LinkRequestQuery } from "@/types/global";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Convert the type of the request query to "LinkRequestQuery"
    const convertedData: Omit<LinkRequestQuery, "tagId"> = {
      sort: Number(req.query.sort as string),
      collectionId: req.query.collectionId
        ? Number(req.query.collectionId as string)
        : undefined,
    };

    if (!convertedData.collectionId) {
      return res
        .status(400)
        .json({ response: "Please choose a valid collection." });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: convertedData.collectionId,
        isPublic: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ response: "Collection not found." });
    }

    const tags = await getTags({
      collectionId: collection.id,
    });

    return res.status(tags?.status || 500).json({ response: tags?.response });
  }
}
