import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@/lib/api/db";
import { DeleteLinksArchiveSchema, PutLinksArchiveSchema } from "@/lib/shared/schemaValidation";
import { removeFiles } from "@/lib/api/manageLinkFiles";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	if (req.method === "PUT") {
		const dataValidation = PutLinksArchiveSchema.safeParse(req.body);
		if (!dataValidation.success) {
			return res.status(400).json({
				response: `Error: ${dataValidation.error.issues[0].message
					} [${dataValidation.error.issues[0].path.join(", ")}]`,
			});
		}

		const { links } = dataValidation.data;

		if (links && links.length > 0) {
			const brokenArchives = await prisma.link.findMany({
				where: {
					id: {
						in: links,
					},
					OR: [
						{ image: "unavailable" },
						{ pdf: "unavailable" },
						{ readable: "unavailable" },
						{ monolith: "unavailable" },
						{ preview: "unavailable" },
					],
				},
			});

			for (const link of brokenArchives) {
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
		} else {
			const brokenArchives = await prisma.link.findMany({
				where: {
					OR: [
						{ image: "unavailable" },
						{ pdf: "unavailable" },
						{ readable: "unavailable" },
						{ monolith: "unavailable" },
					],
				},
			});

			for (const link of brokenArchives) {
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
		}

		return res.status(200).json({ response: "Broken archives deleted." });
	}

	if (req.method === "DELETE") {
		const dataValidation = DeleteLinksArchiveSchema.safeParse(req.body);
		if (!dataValidation.success) {
			return res.status(400).json({
				response: `Error: ${dataValidation.error.issues[0].message
					} [${dataValidation.error.issues[0].path.join(", ")}]`,
			});
		}

		const { action } = dataValidation.data;

		if (action === 'delete') {
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

			return res.status(200).json({ response: "All archives deleted" });
		} else if (action === 're-preserve') {
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
			return res.status(200).json({ response: "All archives deleted and are re-preserving" });
		}
	}
}
