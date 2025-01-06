import { prisma } from "@/lib/api/db";
import verifyUser from "@/lib/api/verifyUser";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const rssId = Number(req.query.id);

  if (req.method === "DELETE") {
    const rssSubscription = await prisma.rssSubscription.findUnique({
      where: { id: rssId },
    });

    if (!rssSubscription)
      return res.status(404).json({ response: "RSS subscription not found." });

    if (rssSubscription.ownerId !== user.id)
      return res.status(403).json({ response: "Permission denied." });

    await prisma.rssSubscription.delete({ where: { id: rssId } });

    return res.status(200).json({ response: "RSS subscription deleted." });
  }
}
