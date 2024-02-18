import type { NextApiRequest, NextApiResponse } from "next";
import getCollectionById from "@/lib/api/controllers/collections/collectionId/getCollectionById";
import updateCollectionById from "@/lib/api/controllers/collections/collectionId/updateCollectionById";
import deleteCollectionById from "@/lib/api/controllers/collections/collectionId/deleteCollectionById";
import verifyUser from "@/lib/api/verifyUser";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const collectionId = Number(req.query.id);

  if (req.method === "GET") {
    const collections = await getCollectionById(user.id, collectionId);
    return res
      .status(collections.status)
      .json({ response: collections.response });
  } else if (req.method === "PUT") {
    const updated = await updateCollectionById(user.id, collectionId, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    const deleted = await deleteCollectionById(user.id, collectionId);
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
