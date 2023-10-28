import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import archive from "@/lib/api/archive";
import { prisma } from "@/lib/api/db";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  console.log("hi");
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
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
    archive(link.id, link.url, session.user.id);
    return res.status(200).json({
      response: "Link is being archived.",
    });
  }

  // Later?
  // else if (req.method === "DELETE") {}
}
