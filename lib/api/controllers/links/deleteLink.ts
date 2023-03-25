import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import { Session } from "next-auth";
import { ExtendedLink } from "@/types/global";
import fs from "fs";
import { Link, UsersAndCollections } from "@prisma/client";
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

  fs.unlink(`data/archives/${link.collectionId}/${link.id}.pdf`, (err) => {
    if (err) console.log(err);
  });

  fs.unlink(`data/archives/${link.collectionId}/${link.id}.png`, (err) => {
    if (err) console.log(err);
  });

  return res.status(200).json({
    response: deleteLink,
  });
}
