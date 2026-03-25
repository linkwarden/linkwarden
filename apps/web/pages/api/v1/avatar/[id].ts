import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@linkwarden/prisma";
import { readFile } from "@linkwarden/filesystem";
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
    });

    if (!targetUser) {
      return res
        .setHeader("Content-Type", "text/plain")
        .status(400)
        .send("File inaccessible.");
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
