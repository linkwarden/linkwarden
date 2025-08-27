import {
  UpdateDashboardLayoutSchema,
  UpdateDashboardLayoutSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";
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
            in: collectionIds as number[],
          },
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      })
    ).map((collection) => collection.id);
  }

  let parsedData = data.filter((section) =>
    section.collectionId ? collectionIds.includes(section.collectionId) : true
  );

  // No need to track individual changes since we're doing a full replace

  await prisma.$transaction(async (tx) => {
    // Delete all existing dashboard sections for this user
    await tx.dashboardSection.deleteMany({
      where: {
        userId,
      },
    });

    // Create all enabled sections with their new order values
    const sectionsToCreateOrUpdate = parsedData
      .filter((section) => section.enabled)
      .map((section) => ({
        userId: userId,
        type: section.type,
        collectionId: section.collectionId || null,
        order: section.order!,
      }));

    if (sectionsToCreateOrUpdate.length > 0) {
      await tx.dashboardSection.createMany({
        data: sectionsToCreateOrUpdate,
      });
    }
  });

  const getData = await getDashboardData(userId);

  return {
    status: 200,
    response: getData,
  };
}
