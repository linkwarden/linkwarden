import type { NextApiRequest, NextApiResponse } from "next";
import getTags from "@/lib/api/controllers/tags/getTags";
import verifyUser from "@/lib/api/verifyUser";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const tags = await getTags(user.id);
    return res.status(tags.status).json({ response: tags.response });
  }
}
