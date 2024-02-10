import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@prisma/client";

export default async function updateLinksById(userId: number, linkIds: number[], data: LinkIncludingShortenedCollectionAndTags) {
	if (!linkIds || linkIds.length === 0) {
		return { response: "Please choose valid links.", status: 401 };
	}

	// Check if the user has access to the collection of each link
	// if any of the links are not accessible, return an error
	for (const linkId of linkIds) {
		const linkIsAccessible = await getPermission({ userId, linkId });

		const memberHasAccess = linkIsAccessible?.members.some(
			(e: UsersAndCollections) => e.userId === userId && e.canUpdate
		);

		if (!(linkIsAccessible?.ownerId === userId || memberHasAccess)) {
			return { response: "Link is not accessible.", status: 401 };
		}
	}

	const updateData = {
		collection: {
			connect: {
				id: data.collection.id,
			},
		},
		tags: {
			set: [],
			connectOrCreate: data.tags.map((tag) => ({
				where: {
					name_ownerId: {
						name: tag.name,
						ownerId: data.collection.ownerId,
					},
				},
				create: {
					name: tag.name,
					owner: {
						connect: {
							id: data.collection.ownerId,
						},
					},
				},
			})),
		},
		include: {
			tags: true,
			collection: true,
		}
	};

	const updatedLinks = await prisma.link.updateMany({
		where: {
			id: { in: linkIds },
		},
		data: updateData,
	});

	return { response: updatedLinks, status: 200 };
}