import type { NextApiRequest, NextApiResponse } from "next";
import updateLinkOrder from "@/lib/api/controllers/links/linkId/updateLinkOrder";
import verifyUser from "@/lib/api/verifyUser";

export default async function order(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateLinkOrder(
      user.id,
      Number(req.query.id),
      req.body
    );

    return res.status(updated.status).json({
      response: updated.response,
    });
  }
}
