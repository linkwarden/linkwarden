import type { NextApiRequest, NextApiResponse } from "next";
import searchLinks from "@/lib/api/controllers/search/searchLinks";
import { LinkRequestQuery } from "@linkwarden/types";
import verifyUser from "@/lib/api/verifyUser";

export default async function search(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    // Convert the type of the request query to "LinkRequestQuery"
    const convertedData: LinkRequestQuery = {
      sort: Number(req.query.sort as string),
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
      collectionId: req.query.collectionId
        ? Number(req.query.collectionId as string)
        : undefined,
      tagId: req.query.tagId ? Number(req.query.tagId as string) : undefined,
      pinnedOnly: req.query.pinnedOnly
        ? req.query.pinnedOnly === "true"
        : undefined,
      searchQueryString: req.query.searchQueryString
        ? (req.query.searchQueryString as string)
        : undefined,
    };

    const { statusCode, ...data } = await searchLinks({
      userId: user.id,
      query: convertedData,
    });

    return res.status(statusCode).json(data);
  }
}
