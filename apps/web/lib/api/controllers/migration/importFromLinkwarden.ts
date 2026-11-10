import { prisma } from "@linkwarden/prisma";
import { Backup, LinksIncludingTags } from "@linkwarden/types/global";
import { createFolder } from "@linkwarden/filesystem";
import { hasPassedLimit } from "@linkwarden/lib/verifyCapacity";
import { COLLECTION_ORDER_STEP } from "@linkwarden/lib/linkOrder";
import { shortenText } from "@linkwarden/lib/shortenText";
import oldestFirst from "@/lib/api/oldestFirst";

export default async function importFromLinkwarden(
  userId: number,
  rawData: string
) {
  const data: Backup = JSON.parse(rawData);

  let totalImports = 0;

  data.collections.forEach((collection) => {
    totalImports += collection.links.length;
  });

  const hasTooManyLinks = await hasPassedLimit(userId, totalImports);

  if (hasTooManyLinks) {
    return {
      response: `Your subscription has reached the maximum number of links allowed.`,
      status: 400,
    };
  }

  // Each link is saved on its own rather than inside one transaction, so a
  // link that can't be saved doesn't undo the ones before it, a large import
  // isn't cut off by a transaction timeout, and an instance whose database
  // allows a single connection can still import.
  let added = 0;

  try {
    // Collections are created in the order the backup lists them, links once
    // all of them exist, so they can go in oldest first.
    const links: { link: LinksIncludingTags; collectionId: number }[] = [];

    // Import collections
    for (const e of data.collections) {
      e.name = e.name.trim();

      const newCollection = await prisma.collection.create({
        data: {
          owner: {
            connect: {
              id: userId,
            },
          },
          name: shortenText(e.name?.trim(), 254),
          description: shortenText(e.description?.trim(), 254),
          color: shortenText(e.color?.trim(), 50),
          createdBy: {
            connect: {
              id: userId,
            },
          },
        },
      });

      createFolder({ filePath: `archives/${newCollection.id}` });

      for (const link of e.links) {
        links.push({ link, collectionId: newCollection.id });
      }
    }

    // The collections were just created, so their links can be numbered as
    // they are read instead of asking the database for the top of the list.
    const collectionOrders = new Map<number, number>();

    // Import Links
    for (const { link, collectionId } of oldestFirst(
      links,
      ({ link }) => new Date(link.importDate || link.createdAt)
    )) {
      if (link.url) {
        try {
          new URL(link.url.trim());
        } catch (err) {
          continue;
        }
      }

      const collectionOrder =
        (collectionOrders.get(collectionId) ?? 0) + COLLECTION_ORDER_STEP;

      const newLink = await prisma.link.create({
        data: {
          url: shortenText(link.url?.trim(), 2047),
          name: shortenText(link.name?.trim(), 254),
          description: shortenText(link.description?.trim(), 254),
          importDate: new Date(link.importDate || link.createdAt),
          collectionOrder,
          collection: {
            connect: {
              id: collectionId,
            },
          },
          createdBy: {
            connect: {
              id: userId,
            },
          },
          // Import Tags
          tags: {
            connectOrCreate: link.tags.map((tag) => {
              // Looked up by the name it's created with, so names that
              // differ only by spaces around them find the same tag
              const name = shortenText(tag.name?.trim(), 49);

              return {
                where: {
                  name_ownerId: {
                    name,
                    ownerId: userId,
                  },
                },
                create: {
                  name,
                  owner: {
                    connect: {
                      id: userId,
                    },
                  },
                },
              };
            }),
          },
        },
      });
      collectionOrders.set(collectionId, collectionOrder);
      added++;

      // Import pinnedLinks
      if (
        data?.pinnedLinks.some((pinnedLink) => pinnedLink.url === newLink.url)
      ) {
        await prisma.link.update({
          where: {
            id: newLink.id,
          },
          data: {
            pinnedBy: { connect: { id: userId } },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error during Linkwarden import:", error);

    return {
      response: `The import stopped after adding ${added} of ${totalImports} links.`,
      status: 500,
    };
  }

  return { response: "Success.", status: 200 };
}
