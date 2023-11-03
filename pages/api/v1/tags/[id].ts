import type { NextApiRequest, NextApiResponse } from "next";
import updeteTagById from "@/lib/api/controllers/tags/tagId/updeteTagById";
import authenticateUser from "@/lib/api/authenticateUser";
import deleteTagById from "@/lib/api/controllers/tags/tagId/deleteTagById";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  const tagId = Number(req.query.id);

  if (req.method === "PUT") {
    const tags = await updeteTagById(user.id, tagId, req.body);
    return res.status(tags.status).json({ response: tags.response });
  } else if (req.method === "DELETE") {
    const tags = await deleteTagById(user.id, tagId);
    return res.status(tags.status).json({ response: tags.response });
  }
}
