import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import verifyUser from "@/lib/api/verifyUser";
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
					}
				},
			},
		});

		return res.status(200).json({ response });
	}

	if (req.method === "POST") {
		const { name, url, collectionId } = req.body;

		const collectionIsAccessible = await getPermission({ userId: user.id, collectionId: Number(collectionId) });

		const memberHasAccess = collectionIsAccessible?.members.some(
			(e: UsersAndCollections) => e.userId === user.id
		);

		if (collectionIsAccessible?.ownerId !== user.id && !memberHasAccess) {
			return res.status(403).json({ response: "You do not have permission to add a link to this collection" });
		}

		const response = await prisma.rssSubscription.create({
			data: {
				name,
				url,
				ownerId: user.id,
				lastBuildDate: new Date(),
				collection: {
					connect: {
						id: collectionId,
					},
				}
			},
		});

		return res.status(200).json({ response });
	}
}