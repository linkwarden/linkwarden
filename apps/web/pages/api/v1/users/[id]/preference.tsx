import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import updateUserPreference from "@/lib/api/controllers/users/userId/updateUserPreference";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const queryId = Number(req.query.id);

  if (!queryId) {
    return res.status(400).json({ response: "Invalid request." });
  }

  if (user.id !== queryId)
    return res.status(401).json({ response: "Permission denied." });

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateUserPreference(user.id, req.body);
    return res.status(updated.status).json({ response: updated.response });
  }
}
