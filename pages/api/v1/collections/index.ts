import type { NextApiRequest, NextApiResponse } from "next";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";
import verifyUser from "@/lib/api/verifyUser";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const collections = await getCollections(user.id);
    return res
      .status(collections.status)
      .json({ response: collections.response });
  } else if (req.method === "POST") {
    const newCollection = await postCollection(req.body, user.id);
    return res
      .status(newCollection.status)
      .json({ response: newCollection.response });
  }
}
