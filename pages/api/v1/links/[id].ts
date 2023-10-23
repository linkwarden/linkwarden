import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import deleteLinkById from "@/lib/api/controllers/links/linkId/deleteLinkById";
import updateLinkById from "@/lib/api/controllers/links/linkId/updateLinkById";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  if (req.method === "PUT") {
    const updated = await updateLinkById(
      session.user.id,
      Number(req.query.id),
      req.body
    );
    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "DELETE") {
    const deleted = await deleteLinkById(session.user.id, Number(req.query.id));
    return res.status(deleted.status).json({
      response: deleted.response,
    });
  }
}
