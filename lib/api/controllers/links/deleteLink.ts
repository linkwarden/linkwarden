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

  const link: ExtendedLink = req?.body;

  if (!link) {
    return res.status(401).json({ response: "Please choose a valid link." });
  }

  const collectionIsAccessible = await hasAccessToCollection(
    session.user.id,
    link.collectionId
  );

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === session.user.id && e.canDelete
  );

  if (!(collectionIsAccessible?.ownerId === session.user.id || memberHasAccess))
    return res.status(401).json({ response: "Collection is not accessible." });

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: link.id,
    },
  });

  return res.status(200).json({
    response: deleteLink,
  });
}
