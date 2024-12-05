import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import setCollection from "@/lib/api/setCollection";
import verifyUser from "@/lib/api/verifyUser";
import { PostRssSubscriptionSchema } from "@/lib/shared/schemaValidation";
import { UsersAndCollections } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const response = await prisma.rssSubscription.findMany({
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(200).json({ response });
  }

  if (req.method === "POST") {
    const dataValidation = PostRssSubscriptionSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${dataValidation.error.issues[0].message
          } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { name, url, collectionId, collectionName } = dataValidation.data;

    const linkCollection = await setCollection({
      userId: user.id,
      collectionId: collectionId,
      collectionName: collectionName,
    });

    if (!linkCollection) {
      return res
        .status(403)
        .json({
          response:
            "You do not have permission to add a link to this collection",
        });
    }

    const existingRssSubscription = await prisma.rssSubscription.findFirst({
      where: {
        name: name,
        ownerId: user.id,
      },
    });

    if (existingRssSubscription) {
      return {
        response: "RSS Subscription with that name already exists.",
        status: 400,
      };
    }

    const response = await prisma.rssSubscription.create({
      data: {
        name,
        url,
        ownerId: user.id,
        lastBuildDate: new Date(),
        collection: {
          connect: {
            id: linkCollection.id,
          },
        },
      },
    });

    return res.status(200).json({ response });
  }
}
