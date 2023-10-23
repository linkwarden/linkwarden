import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import updateTag from "@/lib/api/controllers/tags/tagId/updeteTagById";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.username) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  const tagId = Number(req.query.id);

  if (req.method === "PUT") {
    const tags = await updateTag(session.user.id, tagId, req.body);
    return res.status(tags.status).json({ response: tags.response });
  }
}
