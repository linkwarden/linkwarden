import type { NextApiRequest, NextApiResponse } from "next";
import getPermission from "@/lib/api/getPermission";
import readFile from "@/lib/api/storage/readFile";
import verifyUser from "@/lib/api/verifyUser";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.params)
    return res.status(401).json({ response: "Invalid parameters." });

  const user = await verifyUser({ req, res });
  if (!user) return;

  const collectionId = req.query.params[0];
  const linkId = req.query.params[1];

  const collectionIsAccessible = await getPermission({
    userId: user.id,
    collectionId: Number(collectionId),
  });

  if (!collectionIsAccessible)
    return res
      .status(401)
      .json({ response: "You don't have access to this collection." });

  const { file, contentType, status } = await readFile(
    `archives/${collectionId}/${linkId}`
  );
  res.setHeader("Content-Type", contentType).status(status as number);

  return res.send(file);
}
