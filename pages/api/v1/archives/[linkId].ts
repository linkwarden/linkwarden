import type { NextApiRequest, NextApiResponse } from "next";
import readFile from "@/lib/api/storage/readFile";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/api/db";
import { ArchivedFormat } from "@/types/global";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const linkId = Number(req.query.linkId);
  const format = Number(req.query.format);

  let suffix;

  if (format === ArchivedFormat.screenshot) suffix = ".png";
  else if (format === ArchivedFormat.pdf) suffix = ".pdf";
  else if (format === ArchivedFormat.readability) suffix = "_readability.json";

  if (!linkId || !suffix)
    return res.status(401).json({ response: "Invalid parameters." });

  const token = await getToken({ req });
  const userId = token?.id;

  const collectionIsAccessible = await prisma.collection.findFirst({
    where: {
      links: {
        some: {
          id: linkId,
        },
      },
      OR: [
        { ownerId: userId || -1 },
        { members: { some: { userId: userId || -1 } } },
        { isPublic: true },
      ],
    },
  });

  if (!collectionIsAccessible)
    return res
      .status(401)
      .json({ response: "You don't have access to this collection." });

  const { file, contentType, status } = await readFile(
    `archives/${collectionIsAccessible.id}/${linkId + suffix}`
  );
  res.setHeader("Content-Type", contentType).status(status as number);

  return res.send(file);
}
