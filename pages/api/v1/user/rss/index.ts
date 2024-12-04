import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import setLinkCollection from "@/lib/api/setLinkCollection";
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
		const response = await prisma.rssSubscription.findMany({});

		return res.status(200).json({ response });
	}

	if (req.method === "POST") {
		console.log(req.body);
		const { name, url, collectionId } = req.body;

		const collectionIsAccessible = await getPermission({ userId: user.id, collectionId: Number(collectionId) });

		const memberHasAccess = collectionIsAccessible?.members.some(
			(e: UsersAndCollections) => e.userId === user.id
		);

		if (collectionIsAccessible?.ownerId !== user.id && !memberHasAccess) {
			return res.status(403).json({ error: "You do not have permission to add a link to this collection" });
		}

		const response = await prisma.rssSubscription.create({
			data: {
				name,
				url,
				ownerId: user.id,
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