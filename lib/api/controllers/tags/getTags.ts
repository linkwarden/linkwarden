import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";

export default async function (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  // tag cleanup
  await prisma.tag.deleteMany({
    where: {
      links: {
        none: {},
      },
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      collections: {
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
  });

  return res.status(200).json({
    response: tags || [],
  });
}
