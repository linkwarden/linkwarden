import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";
import { Link } from "@prisma/client";

interface LinkObject {
  id: number;
  name: string;
  url: string;
  tags: string[];
  collectionId: {
    id: string | number;
    isNew: boolean | undefined;
  };
}

export default async function (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  const email: string = session.user.email;
  const link: LinkObject = req?.body;

  if (!link.name) {
    return res
      .status(401)
      .json({ response: "Please enter a valid name for the link." });
  }

  if (link.collectionId.isNew) {
    const collectionId = link.collectionId.id as string;

    const findCollection = await prisma.user.findFirst({
      where: {
        email,
      },
      select: {
        collections: {
          where: {
            name: collectionId,
          },
        },
      },
    });

    const checkIfCollectionExists = findCollection?.collections[0];

    if (checkIfCollectionExists) {
      return res.status(400).json({ response: "Collection already exists." });
    }

    const createCollection = await prisma.collection.create({
      data: {
        owner: {
          connect: {
            id: session.user.id,
          },
        },
        name: collectionId,
      },
    });

    link.collectionId.id = createCollection.id;
  }

  const collectionId = link.collectionId.id as number;

  const createLink: Link = await prisma.link.create({
    data: {
      name: link.name,
      url: "https://www.example.com",
      collection: {
        connect: {
          id: collectionId,
        },
      },
      tags: {
        connectOrCreate: link.tags.map((name) => ({
          where: {
            name_collectionId: {
              name,
              collectionId,
            },
          },
          create: {
            name,
            collections: {
              connect: {
                id: collectionId,
              },
            },
          },
        })),
      },
    },
  });

  return res.status(200).json({
    response: createLink,
  });
}
