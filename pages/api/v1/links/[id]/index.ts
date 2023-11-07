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
    const updated = await updateLinkById(
      user.id,
      Number(req.query.id),
      req.body
    );
    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "DELETE") {
    const deleted = await deleteLinkById(user.id, Number(req.query.id));
    return res.status(deleted.status).json({
      response: deleted.response,
    });
  }
}
