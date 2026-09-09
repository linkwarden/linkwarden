import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getReadingProgress from "@/lib/api/controllers/links/linkId/readingProgress/getReadingProgress";
import upsertReadingProgress from "@/lib/api/controllers/links/linkId/readingProgress/upsertReadingProgress";

export default async function progress(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const linkId = Number(req.query.id as string);

  if (req.method === "GET") {
    if (!user.readingProgressEnabled)
      return res.status(200).json({ response: null });

    const readingProgress = await getReadingProgress({
      userId: user.id,
      linkId,
    });

    return res
      .status(readingProgress?.status || 500)
      .json({ response: readingProgress?.response });
  } else if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    if (!user.readingProgressEnabled)
      return res.status(200).json({ response: null });

    const updated = await upsertReadingProgress(user.id, linkId, req.body);

    return res
      .status(updated?.status || 500)
      .json({ response: updated?.response });
  }
}
