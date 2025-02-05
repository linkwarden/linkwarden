import { prisma } from "@/lib/api/db";
import verifyUser from "@/lib/api/verifyUser";
import { PostArchivalTagSchema } from "@/lib/shared/schemaValidation";
import { NextApiRequest, NextApiResponse } from "next";

export default async function archivalTags(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	if (req.method === "POST") {
		const dataValidation = PostArchivalTagSchema.safeParse(req.body);

		if (!dataValidation.success) {
			return res.status(400).json({
				response: `Error: ${dataValidation.error.issues[0].message
					} [${dataValidation.error.issues[0].path.join(", ")}]`,
			});
		}

		const { tags } = dataValidation.data;

		try {
			await prisma.$transaction(async (tx) => {
				for (const tag of tags) {
					if (tag.newTag) {
						const tagNameIsTaken = await tx.tag.findFirst({
							where: {
								ownerId: user.id,
								name: tag.label,
							},
						});

						if (tagNameIsTaken) {
							throw new Error(`Tag name "${tag.label}" already exists`);
						}

						await tx.tag.create({
							data: {
								name: tag.label,
								ownerId: user.id,
								archiveAsScreenshot: tag.archiveAsScreenshot,
								archiveAsMonolith: tag.archiveAsMonolith,
								archiveAsPDF: tag.archiveAsPDF,
								archiveAsReadable: tag.archiveAsReadable,
								archiveAsWaybackMachine: tag.archiveAsWaybackMachine,
								aiTag: tag.aiTag,
							},
						});
					} else if (tag.value) {
						const targetTag = await tx.tag.findUnique({
							where: { id: tag.value },
						});

						if (!targetTag) {
							throw new Error(`Tag with ID ${tag.value} not found`);
						}

						if (targetTag.ownerId !== user.id) {
							throw new Error(`Permission denied for tag ID ${tag.value}`);
						}

						await tx.tag.update({
							where: { id: tag.value },
							data: {
								archiveAsScreenshot: tag.archiveAsScreenshot,
								archiveAsMonolith: tag.archiveAsMonolith,
								archiveAsPDF: tag.archiveAsPDF,
								archiveAsReadable: tag.archiveAsReadable,
								archiveAsWaybackMachine: tag.archiveAsWaybackMachine,
								aiTag: tag.aiTag,
							},
						});
					}
				}

				return res.status(200).json({ response: "Tags updated successfully" });
			});
		} catch (error: any) {
			return res.status(400).json({ response: error.message });
		}
	}
}
