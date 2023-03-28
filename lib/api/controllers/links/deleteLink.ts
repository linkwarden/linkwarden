import { prisma } from "@/lib/api/db";
import { ExtendedLink } from "@/types/global";
import fs from "fs";
import { Link, UsersAndCollections } from "@prisma/client";
import hasAccessToCollection from "@/lib/api/hasAccessToCollection";

export default async function (link: ExtendedLink, userId: number) {
  if (!link) return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = await hasAccessToCollection(
    userId,
    link.collectionId
  );

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
    return { response: "Collection is not accessible.", status: 401 };

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

  return { response: deleteLink, status: 200 };
}
