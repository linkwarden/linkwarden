import getPermission from "@/lib/api/getPermission";
import { prisma } from "@linkwarden/prisma";


export async function removeAllOrphanTags(userId: number, collectionId?: number) {
	const tagIsAccessible = await getPermission({ userId, collectionId });

	if (!tagIsAccessible) {
		return { response: "Access denied", status: 403 };
	}

	const { count } = await prisma.tag.deleteMany({
		where: {
			ownerId: userId,
			aiGenerated: true,
			links: {
				none: {}
			}
		}
	});

	if (count === 0) {
		return { response: "No AI-generated orphan tags to remove", status: 200 };
	}

	return { response: `Removed ${count} AI-generated orphan tags`, status: 200 };
}

export async function removeOrphanTagFromLink(linkId: number): Promise<{ response: string; status: number }> {
	const link = await prisma.link.findUnique({
		where: { id: linkId },
		include: {
			tags: {
				where: { aiGenerated: true },
				include: {
					_count: {
						select: { links: true }
					}
				}
			}
		}
	});

	if (!link) {
		return { response: "Link not found", status: 404 };
	}

	if (!link.createdById) {
		return { response: "Cannot determine link owner.", status: 400 };
	}

	const orphanTags = link.tags.filter(tag => (tag._count?.links ?? 0) <= 1);

	if (orphanTags.length === 0) {
		return { response: "No AI-generated orphan tags to remove", status: 200 };
	}

	await prisma.tag.deleteMany({
		where: {
			ownerId: link.createdById,
			id: {
				in: orphanTags.map(tag => tag.id)
			}
		}
	});

	return { response: `Removed ${orphanTags.length} AI-generated orphan tags`, status: 200 };
}