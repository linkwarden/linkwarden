import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import archive from "@/lib/api/archive";
import { prisma } from "@/lib/api/db";

const RE_ARCHIVE_LIMIT = Number(process.env.RE_ARCHIVE_LIMIT) || 5;

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    return res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

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

  if (link.collection.ownerId !== session.user.id)
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

    archive(link.id, link.url, session.user.id);
    return res.status(200).json({
      response: "Link is being archived.",
    });
  }

  // Later?
  // else if (req.method === "DELETE") {}
}

const getTimezoneDifferenceInMinutes = (future: Date, past: Date) => {
  const date1 = new Date(future);
  const date2 = new Date(past);

  const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime());

  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
};
