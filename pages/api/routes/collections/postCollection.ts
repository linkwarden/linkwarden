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
  const collectionName: string = req?.body?.collectionName;

  if (!collectionName) {
    return res
      .status(401)
      .json({ response: "Please enter a valid name for the collection." });
  }

  const findCollection = await prisma.user.findFirst({
    where: {
      email,
    },
    select: {
      collections: {
        where: {
          name: collectionName,
        },
      },
    },
  });

  console.log(typeof session.user.id);

  const checkIfCollectionExists = findCollection?.collections[0];

  if (checkIfCollectionExists) {
    return res.status(400).json({ response: "Collection already exists." });
  }

  // const a = await prisma.user.update({
  //   where: {
  //     id: session.user.id,
  //   },
  //   data: {
  //     // collections: {
  //     //   create: { name: "Das" },
  //     // },
  //   },
  //   include: {
  //     collections: { include: { collection: true } },
  //   },
  // });

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      collections: {
        create: [
          {
            name: collectionName,
          },
        ],
      },
    },
  });

  return res.status(200).json({
    response: "Success",
  });
}
