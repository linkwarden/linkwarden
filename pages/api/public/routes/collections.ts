import getCollection from "@/lib/api/controllers/public/getCollection";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const collectionId = Number(req.query.collectionId);

  if (!collectionId) {
    return res
      .status(401)
      .json({ response: "Please choose a valid collection." });
  }

  if (req.method === "GET") {
    const collection = await getCollection(collectionId);
    return res
      .status(collection.status)
      .json({ response: collection.response });
  }
}
