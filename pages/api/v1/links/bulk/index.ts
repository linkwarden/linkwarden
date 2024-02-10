import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import deleteLinksById from "@/lib/api/controllers/links/bulk/deleteLinksById";
import updateLinksById from "@/lib/api/controllers/links/bulk/updateLinksById";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	if (req.method === "PUT") {
		const updated = await updateLinksById(user.id, req.body.linkIds, req.body.data);
		return res.status(updated.status).json({
			response: updated.response,
		});
	}
	else if (req.method === "DELETE") {
		const deleted = await deleteLinksById(user.id, req.body.linkIds);
		return res.status(deleted.status).json({
			response: deleted.response,
		});
	}
}
