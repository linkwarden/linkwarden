// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/api/db";
import path from "path";
import fs from "fs";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  const userId = session?.user.id;
  const userEmail = session?.user.email;
  const queryId = Number(req.query.id);

  if (!queryId)
    return res.status(401).json({ response: "Invalid parameters." });

  if (!userId || !userEmail)
    return res.status(401).json({ response: "You must be logged in." });

  if (userId !== queryId) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: queryId,
      },
    });

    if (
      targetUser?.isPrivate &&
      !targetUser.whitelistedUsers.includes(userEmail)
    ) {
      return res.status(401).json({ response: "This profile is private." });
    }
  }

  const filePath = path.join(
    process.cwd(),
    `data/uploads/avatar/${queryId}.jpg`
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
