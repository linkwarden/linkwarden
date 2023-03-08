import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import AES from "crypto-js/aes";
import enc from "crypto-js/enc-utf8";
import path from "path";
import fs from "fs";
import hasAccessToCollection from "@/lib/api/hasAccessToCollection";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.params)
    return res.status(401).json({ response: "Invalid parameters." });

  const collectionId = req.query.params[0];

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email)
    return res.status(401).json({ response: "You must be logged in." });

  const collectionIsAccessible = await hasAccessToCollection(
    session.user.id,
    Number(collectionId)
  );

  if (!collectionIsAccessible)
    return res
      .status(401)
      .json({ response: "You don't have access to this collection." });

  const AES_SECRET = process.env.AES_SECRET as string;
  const encryptedPath = decodeURIComponent(req.query.params[1]) as string;
  const decryptedPath = AES.decrypt(encryptedPath, AES_SECRET).toString(enc);

  const filePath = path.join(process.cwd(), decryptedPath);
  const file = fs.readFileSync(filePath);

  if (filePath.endsWith(".pdf"))
    res.setHeader("Content-Type", "application/pdf");

  if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");

  return res.status(200).send(file);
}
