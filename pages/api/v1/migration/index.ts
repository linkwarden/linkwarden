import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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
  } else if (req.method === "POST") {
    const request: MigrationRequest = JSON.parse(req.body);

    let data;
    if (request.format === MigrationFormat.htmlFile)
      data = await importFromHTMLFile(user.id, request.data);

    if (request.format === MigrationFormat.linkwarden)
      data = await importFromLinkwarden(user.id, request.data);

    if (data) return res.status(data.status).json({ response: data.response });
  }
}
