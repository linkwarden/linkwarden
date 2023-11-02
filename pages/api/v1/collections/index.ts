import type { NextApiRequest, NextApiResponse } from "next";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

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
