import getLinkById from "@/lib/api/controllers/public/links/linkId/getLinkById";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function link(req: NextApiRequest, res: NextApiResponse) {
  if (!req?.query?.id) {
    return res.status(401).json({ response: "Please choose a valid link." });
  }

  if (req.method === "GET") {
    const link = await getLinkById(Number(req?.query?.id));
    return res.status(link.status).json({ response: link.response });
  }
}
