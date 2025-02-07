import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@/lib/api/db";
import { LinkArchiveActionSchema } from "@/lib/shared/schemaValidation";
import { removeFiles } from "@/lib/api/manageLinkFiles";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	const isServerAdmin = user.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1);

	if (!isServerAdmin) {
		return res.status(401).json({ response: "Permission denied." });
	}

	if (req.method === "DELETE") {
		const dataValidation = LinkArchiveActionSchema.safeParse(req.body);
		if (!dataValidation.success) {
			return res.status(400).json({
				response: `Error: ${dataValidation.error.issues[0].message
					} [${dataValidation.error.issues[0].path.join(", ")}]`,
			});
		}

		const { action } = dataValidation.data;

		if (action === "allAndIgnore") {
			const allLinks = await prisma.link.findMany();

			for (const link of allLinks) {
				await removeFiles(link.id, link.collectionId)
				await prisma.link.update({
					where: {
						id: link.id,
					},
					data: {
						image: "unavailable",
						pdf: "unavailable",
						readable: "unavailable",
						monolith: "unavailable",
						preview: "unavailable",
					}
				})
			}

			return res.status(200).json({ response: "Success." });
		} else if (action === "allAndRePreserve") {
			const allLinks = await prisma.link.findMany();

			for (const link of allLinks) {
				await removeFiles(link.id, link.collectionId)
				await prisma.link.update({
					where: {
						id: link.id,
					},
					data: {
						image: null,
						pdf: null,
						readable: null,
						monolith: null,
						preview: null,
					}
				})
			}

			return res.status(200).json({ response: "Success." });
		} else if (action === "allBroken") {
			const brokenArchives = await prisma.link.findMany({
				where: {
					OR: [
						{ image: "unavailable" },
						{ pdf: "unavailable" },
						{ readable: "unavailable" },
						{ monolith: "unavailable" },
						{ preview: "unavailable" },
					],
				},
				include: {
					createdBy: {
						select: {
							archiveAsScreenshot: true,
							archiveAsMonolith: true,
							archiveAsPDF: true,
							archiveAsReadable: true,
							archiveAsWaybackMachine: true,
						}
					},
					tags: {
						select: {
							archiveAsScreenshot: true,
							archiveAsMonolith: true,
							archiveAsPDF: true,
							archiveAsReadable: true,
							archiveAsWaybackMachine: true,
						}
					}
				}
			});

			// Need to check tags & user options for archival formats
			// and then if the link is missing the same excluded formats
			// then we can ignore it

			return res.status(200).json({ response: "Success." });
		}
	}
}
