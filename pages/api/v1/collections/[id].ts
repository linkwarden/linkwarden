import type { NextApiRequest, NextApiResponse } from "next";
import updateCollectionById from "@/lib/api/controllers/collections/collectionId/updateCollectionById";
import deleteCollectionById from "@/lib/api/controllers/collections/collectionId/deleteCollectionById";
import verifyUser from "@/lib/api/verifyUser";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "PUT") {
    const updated = await updateCollectionById(
      user.id,
      Number(req.query.id) as number,
      req.body
    );
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    const deleted = await deleteCollectionById(
      user.id,
      Number(req.query.id) as number
    );
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
