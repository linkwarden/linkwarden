import type { NextApiRequest, NextApiResponse } from "next";
import deleteLinkById from "@/lib/api/controllers/links/linkId/deleteLinkById";
import updateLinkById from "@/lib/api/controllers/links/linkId/updateLinkById";
import getLinkById from "@/lib/api/controllers/links/linkId/getLinkById";
import verifyUser from "@/lib/api/verifyUser";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const updated = await getLinkById(user.id, Number(req.query.id));
    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateLinkById(
      user.id,
      Number(req.query.id),
      req.body
    );
    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const deleted = await deleteLinkById(user.id, Number(req.query.id));
    return res.status(deleted.status).json({
      response: deleted.response,
    });
  }
}
