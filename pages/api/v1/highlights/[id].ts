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
    const highlights = await deleteHighlightById(
      user.id,
      Number(req.query.id as string)
    );

    return res
      .status(highlights?.status || 500)
      .json({ response: highlights?.response });
  }
}
