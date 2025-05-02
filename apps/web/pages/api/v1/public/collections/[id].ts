import getPublicCollection from "@/lib/api/controllers/public/collections/getPublicCollection";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collection(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req?.query?.id) {
    return res
      .status(401)
      .json({ response: "Please choose a valid collection." });
  }

  if (req.method === "GET") {
    const collection = await getPublicCollection(Number(req?.query?.id));
    return res
      .status(collection.status)
      .json({ response: collection.response });
  }
}
