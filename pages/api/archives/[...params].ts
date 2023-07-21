import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import getPermission from "@/lib/api/getPermission";
import readFile from "@/lib/api/storage/readFile";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.params)
    return res.status(401).json({ response: "Invalid parameters." });

  const collectionId = req.query.params[0];
  const linkId = req.query.params[1];

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.username)
    return res.status(401).json({ response: "You must be logged in." });
  else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  const collectionIsAccessible = await getPermission(
    session.user.id,
    Number(collectionId)
  );

  if (!collectionIsAccessible)
    return res
      .status(401)
      .json({ response: "You don't have access to this collection." });

  const { file, contentType } = await readFile({
    filePath: `archives/${collectionId}/${linkId}`,
  });
  res.setHeader("Content-Type", contentType).status(200);

  return res.send(file);
}
