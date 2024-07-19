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
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateCollectionById(user.id, collectionId, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const deleted = await deleteCollectionById(user.id, collectionId);
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
