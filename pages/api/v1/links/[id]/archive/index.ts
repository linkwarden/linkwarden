import type { NextApiRequest, NextApiResponse } from "next";
import archive from "@/lib/api/archive";
import { prisma } from "@/lib/api/db";
import verifyUser from "@/lib/api/verifyUser";

const RE_ARCHIVE_LIMIT = Number(process.env.RE_ARCHIVE_LIMIT) || 5;

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const link = await prisma.link.findUnique({
    where: {
      id: Number(req.query.id),
    },
    include: { collection: true },
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

    archive(link.id, link.url, user.id);
    return res.status(200).json({
      response: "Link is being archived.",
    });
  }

  // TODO - Later?
  // else if (req.method === "DELETE") {}
}

const getTimezoneDifferenceInMinutes = (future: Date, past: Date) => {
  const date1 = new Date(future);
  const date2 = new Date(past);

  const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime());

  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
};
