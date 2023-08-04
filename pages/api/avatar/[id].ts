import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/api/db";
import readFile from "@/lib/api/storage/readFile";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  const userId = session?.user.id;
  const username = session?.user.username?.toLowerCase();
  const queryId = Number(req.query.id);

  if (!userId || !username)
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("You must be logged in.");
  else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  if (!queryId)
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("Invalid parameters.");

  if (userId !== queryId) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: queryId,
      },
      include: {
        whitelistedUsers: true
      }
    });

    const whitelistedUsernames = targetUser?.whitelistedUsers.map(whitelistedUsername => whitelistedUsername.username);

    if (
      targetUser?.isPrivate &&
      !whitelistedUsernames?.includes(username)
    ) {
      return res
        .setHeader("Content-Type", "text/plain")
        .send("This profile is private.");
    }
  }

  const { file, contentType } = await readFile({
    filePath: `uploads/avatar/${queryId}.jpg`,
  });

  res.setHeader("Content-Type", contentType);

  return res.send(file);
}
