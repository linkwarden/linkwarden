import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";

export default async function collections(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    return res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

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
  }
}
