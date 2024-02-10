import { prisma } from "@/lib/api/db";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import removeFile from "@/lib/api/storage/removeFile";

export default async function deleteLinksById(userId: number, linkIds: number[]) {
	console.log("linkIds: ", linkIds);
	if (!linkIds || linkIds.length === 0) {
		return { response: "Please choose valid links.", status: 401 };
	}

	const deletedLinks = [];

	for (const linkId of linkIds) {
		const collectionIsAccessible = await getPermission({
			userId,
			linkId,
		});

		const memberHasAccess = collectionIsAccessible?.members.some(
			(e: UsersAndCollections) => e.userId === userId && e.canDelete
		);

		if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess)) {
			return { response: "Collection is not accessible.", status: 401 };
		}

		const deletedLink = await prisma.link.delete({
			where: {
				id: linkId,
			},
		});

		removeFile({
			filePath: `archives/${collectionIsAccessible?.id}/${linkId}.pdf`,
		});
		removeFile({
			filePath: `archives/${collectionIsAccessible?.id}/${linkId}.png`,
		});
		removeFile({
			filePath: `archives/${collectionIsAccessible?.id}/${linkId}_readability.json`,
		});

		deletedLinks.push(deletedLink);
	}

	return { response: deletedLinks, status: 200 };
}