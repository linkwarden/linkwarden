import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import getLinks from "@/lib/api/controllers/links/getLinks";
import postLink from "@/lib/api/controllers/links/postLink";
import { LinkRequestQuery } from "@/types/global";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

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
      searchByName: req.query.searchByName === "true" ? true : undefined,
      searchByUrl: req.query.searchByUrl === "true" ? true : undefined,
      searchByDescription:
        req.query.searchByDescription === "true" ? true : undefined,
      searchByTags: req.query.searchByTags === "true" ? true : undefined,
    };

    const links = await getLinks(session.user.id, convertedData);
    return res.status(links.status).json({ response: links.response });
  } else if (req.method === "POST") {
    const newlink = await postLink(req.body, session.user.id);
    return res.status(newlink.status).json({
      response: newlink.response,
    });
  }
}
