import getPublicLinksUnderCollection from "@/lib/api/controllers/public/links/getPublicLinksUnderCollection";
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
      searchByName: req.query.searchByName === "true" ? true : undefined,
      searchByUrl: req.query.searchByUrl === "true" ? true : undefined,
      searchByDescription:
        req.query.searchByDescription === "true" ? true : undefined,
      searchByTextContent:
        req.query.searchByTextContent === "true" ? true : undefined,
      searchByTags: req.query.searchByTags === "true" ? true : undefined,
    };

    if (!convertedData.collectionId) {
      return res
        .status(400)
        .json({ response: "Please choose a valid collection." });
    }

    const links = await getPublicLinksUnderCollection(convertedData);
    return res.status(links.status).json({ response: links.response });
  }
}
