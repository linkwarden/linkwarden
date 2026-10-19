import { prisma } from "@linkwarden/prisma";
import {
  ReadingListRemoveSchema,
  ReadingListRemoveSchemaType,
} from "@linkwarden/lib/schemaValidation";

export default async function removeFromReadingList(
  userId: number,
  body: ReadingListRemoveSchemaType
) {
  const dataValidation = ReadingListRemoveSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  await prisma.readingListItem.deleteMany({
    where: { userId, linkId: { in: dataValidation.data.linkIds } },
  });

  return { response: "Reading list updated.", status: 200 };
}
