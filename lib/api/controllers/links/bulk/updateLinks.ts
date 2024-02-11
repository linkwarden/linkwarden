import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import updateLinkById from "../linkId/updateLinkById";

export default async function updateLinks(userId: number, links: LinkIncludingShortenedCollectionAndTags[], newData: Pick<LinkIncludingShortenedCollectionAndTags, "tags" | "collectionId">) {
	let allUpdatesSuccessful = true;

	// Have to use a loop here rather than updateMany, see the following:
	// https://github.com/prisma/prisma/issues/3143
	for (const link of links) {
		const updatedData: LinkIncludingShortenedCollectionAndTags = {
			...link,
			tags: [...link.tags, ...(newData.tags ?? [])],
			collection: {
				...link.collection,
				id: newData.collectionId ?? link.collection.id,
			}
		};

		const updatedLink = await updateLinkById(userId, link.id as number, updatedData);

		if (updatedLink.status !== 200) {
			allUpdatesSuccessful = false;
		}
	}

	if (allUpdatesSuccessful) {
		return { response: "All links updated successfully", status: 200 };
	} else {
		return { response: "Some links failed to update", status: 400 };
	}
}