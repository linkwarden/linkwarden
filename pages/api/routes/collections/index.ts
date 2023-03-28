import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  if (req.method === "GET") {
    const collections = await getCollections(session.user.id);
    return res
      .status(collections.status)
      .json({ response: collections.response });
  } else if (req.method === "POST") {
    const newCollection = await postCollection(
      req.body.collectionName.trim(),
      session.user.id
    );
    return res
      .status(newCollection.status)
      .json({ response: newCollection.response });
  }
}
