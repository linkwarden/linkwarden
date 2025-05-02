import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getLinkHighlights from "@/lib/api/controllers/links/linkId/highlight/getLinkHighlights";

export default async function highlights(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const highlights = await getLinkHighlights({
      userId: user.id,
      linkId: Number(req.query.id as string),
    });

    return res
      .status(highlights?.status || 500)
      .json({ response: highlights?.response });
  }
}
