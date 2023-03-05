import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";

export default async function (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  const tags = await prisma.link.findMany({
    where: {
      collection: {
        OR: [
          {
            ownerId: session?.user.id,
          },
          {
            members: {
              some: {
                userId: session?.user.id,
              },
            },
          },
        ],
      },
    },
    include: { tags: true },
  });

  return res.status(200).json({
    response: tags || [],
  });
}
