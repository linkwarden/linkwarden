import type { NextApiRequest, NextApiResponse } from "next";
import updateTag from "@/lib/api/controllers/tags/tagId/updeteTagById";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  const tagId = Number(req.query.id);

  if (req.method === "PUT") {
    const tags = await updateTag(user.id, tagId, req.body);
    return res.status(tags.status).json({ response: tags.response });
  }
}
