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
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("Invalid parameters.");

  if (!userId || !userEmail)
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("You must be logged in.");

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
      return res
        .setHeader("Content-Type", "text/plain")
        .send("This profile is private.");
    }
  }

  const filePath = path.join(
    process.cwd(),
    `data/uploads/avatar/${queryId}.jpg`
  );

  const file = fs.existsSync(filePath)
    ? fs.readFileSync(filePath)
    : "File not found.";

  if (!fs.existsSync(filePath)) res.setHeader("Content-Type", "text/plain");
  else res.setHeader("Content-Type", "image/jpeg");

  return res.send(file);
}
