import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import mergeTags from "@/lib/api/controllers/tags/mergeTags";

export default async function merge(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const tags = await mergeTags(user.id, req.body);
    return res.status(tags.status).json({ response: tags.response });
  }
}
