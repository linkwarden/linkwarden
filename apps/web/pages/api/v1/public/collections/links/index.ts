import searchLinks from "@/lib/api/controllers/search/searchLinks";
import { LinkRequestQuery } from "@linkwarden/types";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Convert the type of the request query to "LinkRequestQuery"
    const convertedData: LinkRequestQuery = {
      sort: Number(req.query.sort as string),
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
      collectionId: req.query.collectionId
        ? Number(req.query.collectionId as string)
        : undefined,
      pinnedOnly: req.query.pinnedOnly
        ? req.query.pinnedOnly === "true"
        : undefined,
      searchQueryString: req.query.searchQueryString
        ? (req.query.searchQueryString as string)
        : undefined,
    };

    if (!convertedData.collectionId) {
      return res
        .status(400)
        .json({ response: "Please choose a valid collection." });
    }

    const { statusCode, ...data } = await searchLinks({
      query: convertedData,
      publicOnly: true,
    });

    return res.status(statusCode).json(data);
  }
}
