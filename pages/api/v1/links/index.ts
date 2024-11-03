import type { NextApiRequest, NextApiResponse } from "next";
import getLinks from "@/lib/api/controllers/links/getLinks";
import postLink from "@/lib/api/controllers/links/postLink";
import { LinkRequestQuery } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import deleteLinksById from "@/lib/api/controllers/links/bulk/deleteLinksById";
import updateLinks from "@/lib/api/controllers/links/bulk/updateLinks";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
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
      searchByName: req.query.searchByName === "true" ? true : undefined,
      searchByUrl: req.query.searchByUrl === "true" ? true : undefined,
      searchByDescription:
        req.query.searchByDescription === "true" ? true : undefined,
      searchByTextContent:
        req.query.searchByTextContent === "true" ? true : undefined,
      searchByTags: req.query.searchByTags === "true" ? true : undefined,
    };

    const links = await getLinks(user.id, convertedData);
    return res.status(links.status).json({ response: links.response });
  } else if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const newlink = await postLink(req.body, user.id);
    return res.status(newlink.status).json({
      response: newlink.response,
    });
  } else if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateLinks(
      user.id,
      req.body.links,
      req.body.removePreviousTags,
      req.body.newData
    );

    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const deleted = await deleteLinksById(user.id, req.body.linkIds);
    return res.status(deleted.status).json({
      response: deleted.response,
    });
  }
}
