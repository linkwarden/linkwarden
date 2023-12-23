import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import verifyUser from "@/lib/api/verifyUser";
import isValidUrl from "@/lib/shared/isValidUrl";
import removeFile from "@/lib/api/storage/removeFile";
import { Collection, Link } from "@prisma/client";

const RE_ARCHIVE_LIMIT = Number(process.env.RE_ARCHIVE_LIMIT) || 5;

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const link = await prisma.link.findUnique({
    where: {
      id: Number(req.query.id),
    },
    include: { collection: { include: { owner: true } } },
  });

  if (!link)
    return res.status(404).json({
      response: "Link not found.",
    });

  if (link.collection.ownerId !== user.id)
    return res.status(401).json({
      response: "Permission denied.",
    });

  if (req.method === "PUT") {
    if (
      link?.lastPreserved &&
      getTimezoneDifferenceInMinutes(new Date(), link?.lastPreserved) <
        RE_ARCHIVE_LIMIT
    )
      return res.status(400).json({
        response: `This link is currently being saved or has already been preserved. Please retry in ${
          RE_ARCHIVE_LIMIT -
          Math.floor(
            getTimezoneDifferenceInMinutes(new Date(), link?.lastPreserved)
          )
        } minutes or create a new one.`,
      });

    if (!link.url || !isValidUrl(link.url))
      return res.status(200).json({
        response: "Invalid URL.",
      });

    await deleteArchivedFiles(link);

    return res.status(200).json({
      response: "Link is being archived.",
    });
  }
}

const getTimezoneDifferenceInMinutes = (future: Date, past: Date) => {
  const date1 = new Date(future);
  const date2 = new Date(past);

  const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime());

  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
};

const deleteArchivedFiles = async (link: Link & { collection: Collection }) => {
  await prisma.link.update({
    where: {
      id: link.id,
    },
    data: {
      image: null,
      pdf: null,
      readable: null,
      preview: null,
    },
  });

  await removeFile({
    filePath: `archives/${link.collection.id}/${link.id}.pdf`,
  });
  await removeFile({
    filePath: `archives/${link.collection.id}/${link.id}.png`,
  });
  await removeFile({
    filePath: `archives/${link.collection.id}/${link.id}_readability.json`,
  });
  await removeFile({
    filePath: `archives/preview/${link.collection.id}/${link.id}.png`,
  });
};
