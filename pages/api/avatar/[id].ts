// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import path from "path";
import fs from "fs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.id)
    return res.status(401).json({ response: "Invalid parameters." });

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email)
    return res.status(401).json({ response: "You must be logged in." });

  // TODO: If profile is private, hide it to other users...

  const filePath = path.join(
    process.cwd(),
    `data/uploads/avatar/${req.query.id}.jpg`
  );

  console.log(filePath);
  const file = fs.existsSync(filePath)
    ? fs.readFileSync(filePath)
    : "File not found.";

  if (!fs.existsSync(filePath))
    res.setHeader("Content-Type", "text/plain").status(404);
  else res.setHeader("Content-Type", "image/jpeg").status(200);

  return res.send(file);
}
