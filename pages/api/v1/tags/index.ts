import type { NextApiRequest, NextApiResponse } from "next";
import getTags from "@/lib/api/controllers/tags/getTags";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  if (req.method === "GET") {
    const tags = await getTags(user.id);
    return res.status(tags.status).json({ response: tags.response });
  }
}
