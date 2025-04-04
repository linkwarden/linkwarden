import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import deleteHighlightById from "@/lib/api/controllers/highlights/deleteHighlightById";

export default async function highlights(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const highlights = await deleteHighlightById(
      user.id,
      Number(req.query.id as string)
    );

    return res
      .status(highlights?.status || 500)
      .json({ response: highlights?.response });
  }
}
