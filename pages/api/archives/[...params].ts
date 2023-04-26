// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import AES from "crypto-js/aes";
import enc from "crypto-js/enc-utf8";
import path from "path";
import fs from "fs";
import getPermission from "@/lib/api/getPermission";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.params)
    return res.status(401).json({ response: "Invalid parameters." });

  const collectionId = req.query.params[0];

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email)
    return res.status(401).json({ response: "You must be logged in." });

  const collectionIsAccessible = await getPermission(
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
  const file = fs.existsSync(filePath)
    ? fs.readFileSync(filePath)
    : "File not found, it's possible that the file you're looking for either doesn't exist or hasn't been created yet.";

  if (!fs.existsSync(filePath))
    res.setHeader("Content-Type", "text/plain").status(404);
  else if (filePath.endsWith(".pdf"))
    res.setHeader("Content-Type", "application/pdf").status(200);
  else if (filePath.endsWith(".png"))
    res.setHeader("Content-Type", "image/png").status(200);

  return res.send(file);
}
