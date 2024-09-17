import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import updateLinkById from "../linkId/updateLinkById";
import { UpdateLinkSchemaType } from "@/lib/shared/schemaValidation";

export default async function updateLinks(
  userId: number,
  links: UpdateLinkSchemaType[],
  removePreviousTags: boolean,
  newData: Pick<
    LinkIncludingShortenedCollectionAndTags,
    "tags" | "collectionId"
  >
) {
  let allUpdatesSuccessful = true;

  // Have to use a loop here rather than updateMany, see the following:
  // https://github.com/prisma/prisma/issues/3143
  for (const link of links) {
    let updatedTags = [...link.tags, ...(newData.tags ?? [])];

    if (removePreviousTags) {
      // If removePreviousTags is true, replace the existing tags with new tags
      updatedTags = [...(newData.tags ?? [])];
    }

    const updatedData: UpdateLinkSchemaType = {
      ...link,
      tags: updatedTags,
      collection: {
        ...link.collection,
        id: newData.collectionId ?? link.collection.id,
      },
    };

    const updatedLink = await updateLinkById(
      userId,
      link.id as number,
      updatedData
    );

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
