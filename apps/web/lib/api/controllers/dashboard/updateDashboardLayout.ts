import {
  UpdateDashboardLayoutSchema,
  UpdateDashboardLayoutSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";
import { DashboardSection } from "@linkwarden/prisma/client";

export default async function updateDashboardLayout(
  userId: number,
  body: UpdateDashboardLayoutSchemaType[]
): Promise<any> {
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
  const sectionsToUpdate: Partial<DashboardSection>[] = [];
  const sectionsToDelete: number[] = [];

  for (const section of data) {
    const key = `${section.type}-${section.collectionId || "default"}`;
    const existingSection = existingSectionsMap.get(key);

    if (existingSection && !section.enabled) {
      sectionsToDelete.push(existingSection.id);
    } else if (existingSection && section.enabled) {
      sectionsToUpdate.push({
        id: existingSection.id,
        order: section.order,
      });
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
    if (sectionsToDelete.length > 0) {
      await tx.dashboardSection.deleteMany({
        where: {
          id: {
            in: sectionsToDelete,
          },
        },
      });
    }

    if (sectionsToUpdate.length > 0) {
      await Promise.all(
        sectionsToUpdate.map((section: any) =>
          tx.dashboardSection.update({
            where: { id: section.id },
            data: { order: section.order },
          })
        )
      );
    }

    if (sectionsToCreate.length > 0) {
      await tx.dashboardSection.createMany({
        data: sectionsToCreate,
      });
    }
  });

  return {
    status: 200,
    response: data,
  };
}
