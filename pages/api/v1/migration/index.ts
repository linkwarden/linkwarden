import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";

import verifyUser from "@/lib/api/verifyUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const data = await exportData(user.id);

    if (data.status === 200)
      return res
        .setHeader("Content-Type", "application/json")
        .setHeader("Content-Disposition", "attachment; filename=backup.json")
        .status(data.status)
        .json(data.response);
  } // TODO needs handling for invalid request type
}
