import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import bulkTagDelete from "@/lib/api/controllers/tags/bulkTagDelete";

export default async function bulkDelete(
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

    const tags = await bulkTagDelete(user.id, req.body);
    return res.status(tags.status).json({ response: tags.response });
  }
}
