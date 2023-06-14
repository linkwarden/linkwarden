import getCollection from "@/lib/api/controllers/public/getCollection";
import { PublicLinkRequestQuery } from "@/types/global";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query: PublicLinkRequestQuery = req.query;

  if (!query) {
    return res
      .status(401)
      .json({ response: "Please choose a valid collection." });
  }

  if (req.method === "GET") {
    const collection = await getCollection(query);
    return res
      .status(collection.status)
      .json({ response: collection.response });
  }
}
