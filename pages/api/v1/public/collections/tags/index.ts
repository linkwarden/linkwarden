import getPublicLinksUnderCollection from "@/lib/api/controllers/public/links/getPublicLinksUnderCollection";
import getTags from "@/lib/api/controllers/tags/getTags";
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

    const links = await getPublicLinksUnderCollection(convertedData, true);
    const tags = await getTags();
    const tagsInLinks = links.response.map(l => l.tags).flat().filter((value, index, self) =>
  index === self.findIndex((t) => (
    t.name === value.name
  ))).map(t => t.id);
    const tagsWithCount = tags.response.filter(tag => tagsInLinks.includes(tag.id));
    
    return res.status(links.status).json({ response: tagsWithCount });
  }
}
