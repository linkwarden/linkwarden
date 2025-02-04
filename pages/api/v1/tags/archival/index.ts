import verifyUser from "@/lib/api/verifyUser";
import { NextApiRequest, NextApiResponse } from "next";

export default async function archivalTags(req: NextApiRequest, res: NextApiResponse) {
	const user = await verifyUser({ req, res });
	if (!user) return;

	// The body should be like this
	// {
	//		tags: [{ id: 1, archiveAsScreenshot: true }, { id: 2, archiveAsMonolith: true }]	
	//}

	// Update or create
	// Will sometimes sent ID, sometimes not

	if (req.method === "POST") {

	}
}
