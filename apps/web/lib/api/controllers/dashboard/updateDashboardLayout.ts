import {
  UpdateDashboardLayoutSchema,
  UpdateDashboardLayoutSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";

export default async function updateDashboardLayout(
  userId: number,
  body: UpdateDashboardLayoutSchemaType[]
): Promise<any> {
  const dataValidation = UpdateDashboardLayoutSchema.safeParse(body);

  if (!dataValidation.success) {
    console.log(dataValidation.error.issues[0].message);
    return {
      response: `Error: ${dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const data = dataValidation.data;

  // This can be improved - less queries and not in a loop
  for (const section of data) {
    const existingSection = await prisma.dashboardSection.findFirst({
      where: {
        userId: userId,
        type: section.type,
        collectionId: section.collectionId || undefined,
      },
    });

    if (existingSection && !section.enabled) {
      await prisma.dashboardSection.delete({
        where: {
          id: existingSection.id,
        },
      });
    } else if (existingSection && section.enabled) {
      await prisma.dashboardSection.update({
        where: {
          id: existingSection.id,
        },
        data: {
          order: section.order,
        },
      });
    } else if (section.enabled) {
      await prisma.dashboardSection.create({
        data: {
          userId: userId,
          type: section.type,
          collectionId: section.collectionId || undefined,
          order: section.order || 0,
        },
      });
    }
  }

  return {
    status: 200,
    response: data,
  };
}
