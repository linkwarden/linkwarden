import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/db";

type Data = {
  response: object[] | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  const email: string = session.user.email;

  const findCollection = await prisma.user.findFirst({
    where: {
      email: email,
    },
    include: {
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });

  const collections = findCollection?.collections.map((e) => {
    return { id: e.collection.id, name: e.collection.name, role: e.role };
  });

  // console.log(session?.user?.email);

  return res.status(200).json({
    response: collections || [],
  });
}
