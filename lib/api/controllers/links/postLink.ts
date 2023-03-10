import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";
import { ExtendedLink, NewLink } from "@/types/global";
import { existsSync, mkdirSync } from "fs";
import getTitle from "../../getTitle";
import archive from "../../archive";
import { Link, UsersAndCollections } from "@prisma/client";
import AES from "crypto-js/aes";
import hasAccessToCollection from "@/lib/api/hasAccessToCollection";

export default async function (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  const email: string = session.user.email;
  const link: NewLink = req?.body;

  if (!link.name) {
    return res
      .status(401)
      .json({ response: "Please enter a valid name for the link." });
  }

  if (link.collection.isNew) {
    const collectionId = link.collection.id as string;

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

    if (checkIfCollectionExists)
      return res.status(400).json({ response: "Collection already exists." });

    const newCollection = await prisma.collection.create({
      data: {
        owner: {
          connect: {
            id: session.user.id,
          },
        },
        name: collectionId,
      },
    });

    const collectionPath = `data/archives/${newCollection.id}`;
    if (!existsSync(collectionPath))
      mkdirSync(collectionPath, { recursive: true });

    link.collection.id = newCollection.id;
  }

  const collectionId = link.collection.id as number;

  const collectionIsAccessible = await hasAccessToCollection(
    session.user.id,
    collectionId
  );

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === session.user.id && e.canCreate
  );

  if (!(collectionIsAccessible?.ownerId === session.user.id || memberHasAccess))
    return res.status(401).json({ response: "Collection is not accessible." });

  const title = await getTitle(link.url);

  const newLink: Link = await prisma.link.create({
    data: {
      name: link.name,
      url: link.url,
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
      title,
      isFavorites: false,
      screenshotPath: "",
      pdfPath: "",
    },
  });

  const AES_SECRET = process.env.AES_SECRET as string;

  const screenShotHashedPath = AES.encrypt(
    `data/archives/${newLink.collectionId}/${newLink.id}.png`,
    AES_SECRET
  ).toString();

  const pdfHashedPath = AES.encrypt(
    `data/archives/${newLink.collectionId}/${newLink.id}.pdf`,
    AES_SECRET
  ).toString();

  const updatedLink: ExtendedLink = await prisma.link.update({
    where: { id: newLink.id },
    data: { screenshotPath: screenShotHashedPath, pdfPath: pdfHashedPath },
    include: { tags: true, collection: true },
  });

  archive(updatedLink.url, updatedLink.collectionId, updatedLink.id);

  return res.status(200).json({
    response: updatedLink,
  });
}
