import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";
import updateCollection from "@/lib/api/controllers/collections/updateCollection";
import deleteCollection from "@/lib/api/controllers/collections/deleteCollection";

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
    const newCollection = await postCollection(req.body, session.user.id);
    return res
      .status(newCollection.status)
      .json({ response: newCollection.response });
  } else if (req.method === "PUT") {
    const updated = await updateCollection(req.body, session.user.id);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    const deleted = await deleteCollection(req.body, session.user.id);
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
