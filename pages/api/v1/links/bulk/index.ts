import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import deleteLinksById from "@/lib/api/controllers/links/bulk/deleteLinksById";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	if (req.method === "DELETE") {
		const deleted = await deleteLinksById(user.id, req.body.linkIds);
		return res.status(deleted.status).json({
			response: deleted.response,
		});
	}
}
