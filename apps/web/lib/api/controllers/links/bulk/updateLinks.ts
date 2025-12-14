import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import updateLinkById from "../linkId/updateLinkById";
import { UpdateLinkSchemaType } from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";

export default async function updateLinks(
  userId: number,
  links: { id: number }[],
  removePreviousTags: boolean,
  newData: Pick<
    LinkIncludingShortenedCollectionAndTags,
    "tags" | "collectionId"
  >
) {
  let allUpdatesSuccessful = true;

  const ids = links.map((l) => l.id);

  const dbLinks = await prisma.link.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      url: true,
      description: true,
      icon: true,
      iconWeight: true,
      color: true,
      collectionId: true,
      collection: { select: { id: true, ownerId: true } },
      tags: { select: { name: true } },
    },
  });

  // Map id -> link for quick lookup
  const byId = new Map(dbLinks.map((l) => [l.id, l]));

  for (const l of links) {
    const link = byId.get(l.id);

    if (!link) continue;

    const updatedData: UpdateLinkSchemaType = {
      ...link,
      tags: [...(newData.tags ?? [])],
      collection: {
        ...link.collection,
        id: newData.collectionId ?? link.collection.id,
      },
    };

    const updatedLink = await updateLinkById(
      userId,
      link.id as number,
      updatedData,
      removePreviousTags
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
