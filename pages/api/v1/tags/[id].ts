import type { NextApiRequest, NextApiResponse } from "next";
import updeteTagById from "@/lib/api/controllers/tags/tagId/updeteTagById";
import verifyUser from "@/lib/api/verifyUser";
import deleteTagById from "@/lib/api/controllers/tags/tagId/deleteTagById";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const tagId = Number(req.query.id);

  if (!tagId)
    return res.status(400).json({
      response: "Please choose a valid name for the tag.",
    });

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const tags = await updeteTagById(user.id, tagId, req.body);
    return res.status(tags.status).json({ response: tags.response });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const tags = await deleteTagById(user.id, tagId);
    return res.status(tags.status).json({ response: tags.response });
  }
}
