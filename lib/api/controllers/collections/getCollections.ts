import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";

export default async function (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  const collections = await prisma.collection.findMany({
    where: {
      ownerId: session?.user.id,
    },
  });

  return res.status(200).json({
    response: collections || [],
  });
}
