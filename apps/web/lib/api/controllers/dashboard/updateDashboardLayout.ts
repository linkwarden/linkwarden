import {
  UpdateDashboardLayoutSchema,
  UpdateDashboardLayoutSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";
import { DashboardSection } from "@linkwarden/prisma/client";
import getDashboardData from "./getDashboardDataV2";

export default async function updateDashboardLayout(
  userId: number,
  body: UpdateDashboardLayoutSchemaType[]
) {
  const dataValidation = UpdateDashboardLayoutSchema.safeParse(body);

  if (!dataValidation.success) {
    console.log(dataValidation.error.issues[0].message);
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const data = dataValidation.data;

  let collectionIds = data
    .map((section) => section.collectionId)
    .filter((id) => id !== undefined);

  if (collectionIds && collectionIds.length > 0) {
    collectionIds = (
      await prisma.collection.findMany({
        where: {
          id: {
            in: collectionIds,
          },
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      })
    ).map((collection) => collection.id);
  }

  let parsedData = data.filter((section) =>
    section.collectionId ? collectionIds.includes(section.collectionId) : true
  );

  const existingSections = await prisma.dashboardSection.findMany({
    where: {
      userId: userId,
    },
  });

  const existingSectionsMap = new Map(
    existingSections.map((section) => [
      `${section.type}-${section.collectionId || "default"}`,
      section,
    ])
  );

  const sectionsToCreate: Pick<
    DashboardSection,
    "userId" | "type" | "collectionId" | "order"
  >[] = [];
  const sectionsToUpdate: Array<{
    id: number;
    newOrder: number;
    oldOrder: number;
  }> = [];
  const sectionsToDelete: Array<{
    id: number;
    order: number;
  }> = [];

  for (const section of parsedData) {
    const key = `${section.type}-${section.collectionId || "default"}`;
    const existingSection = existingSectionsMap.get(key);

    if (existingSection && !section.enabled) {
      sectionsToDelete.push({
        id: existingSection.id,
        order: existingSection.order,
      });
    } else if (existingSection && section.enabled) {
      if (existingSection.order !== section.order) {
        sectionsToUpdate.push({
          id: existingSection.id,
          newOrder: section.order!,
          oldOrder: existingSection.order,
        });
      }
    } else if (section.enabled) {
      sectionsToCreate.push({
        userId: userId,
        type: section.type,
        collectionId: section.collectionId || null,
        order: section.order!,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const sectionToDelete of sectionsToDelete) {
      await tx.dashboardSection.delete({
        where: {
          id: sectionToDelete.id,
        },
      });

      // Decrement order for all sections with order greater than deleted section
      await tx.dashboardSection.updateMany({
        where: {
          userId,
          order: {
            gt: sectionToDelete.order,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    }

    // Handle order updates - need to be careful about conflicts
    for (const sectionToUpdate of sectionsToUpdate) {
      const { id, newOrder, oldOrder } = sectionToUpdate;

      if (newOrder > oldOrder) {
        // Moving down: decrement order for sections between oldOrder and newOrder
        await tx.dashboardSection.updateMany({
          where: {
            userId,
            order: {
              gt: oldOrder,
              lte: newOrder,
            },
            id: {
              not: id,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        });
      } else if (newOrder < oldOrder) {
        await tx.dashboardSection.updateMany({
          where: {
            userId,
            order: {
              gte: newOrder,
              lt: oldOrder,
            },
            id: {
              not: id,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        });
      }

      await tx.dashboardSection.update({
        where: { id },
        data: { order: newOrder },
      });
    }

    if (sectionsToCreate.length > 0) {
      await tx.dashboardSection.createMany({
        data: sectionsToCreate,
      });
    }
  });

  const getData = await getDashboardData(userId);

  return {
    status: 200,
    response: getData,
  };
}
