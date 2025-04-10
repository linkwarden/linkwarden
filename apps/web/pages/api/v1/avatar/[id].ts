import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import readFile from "@/lib/api/storage/readFile";
import verifyToken from "@/lib/api/verifyToken";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const queryId = Number(req.query.id);

  if (!queryId)
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("Invalid parameters.");

  const token = await verifyToken({ req });
  const userId = typeof token === "string" ? undefined : token?.id;

  if (req.method === "GET") {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: queryId,
      },
      include: {
        whitelistedUsers: true,
      },
    });

    if (!targetUser) {
      return res
        .setHeader("Content-Type", "text/plain")
        .status(400)
        .send("File inaccessible.");
    }

    const isInAPublicCollection = await prisma.collection.findFirst({
      where: {
        ["OR"]: [
          { ownerId: targetUser.id },
          {
            members: {
              some: {
                userId: targetUser.id,
              },
            },
          },
        ],
        isPublic: true,
      },
    });

    if (targetUser?.isPrivate && !isInAPublicCollection) {
      if (!userId) {
        return res
          .setHeader("Content-Type", "text/plain")
          .status(400)
          .send("File inaccessible.");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          subscriptions: true,
        },
      });

      const whitelistedUsernames = targetUser?.whitelistedUsers.map(
        (whitelistedUsername) => whitelistedUsername.username
      );

      if (!user?.username) {
        return res
          .setHeader("Content-Type", "text/plain")
          .status(400)
          .send("File inaccessible.");
      }

      if (
        user.username &&
        !whitelistedUsernames?.includes(user.username) &&
        targetUser.id !== user.id
      ) {
        return res
          .setHeader("Content-Type", "text/plain")
          .status(400)
          .send("File inaccessible.");
      }
    }

    const { file, contentType, status } = await readFile(
      `uploads/avatar/${queryId}.jpg`
    );

    return res
      .setHeader("Content-Type", contentType)
      .status(status as number)
      .send(file);
  }
}
