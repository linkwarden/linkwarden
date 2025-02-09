import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import importFromWallabag from "@/lib/api/controllers/migration/importFromWallabag";
import importFromOmnivore from "@/lib/api/controllers/migration/importFromOmnivore";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: process.env.IMPORT_LIMIT
        ? process.env.IMPORT_LIMIT + "mb"
        : "10mb",
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
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const request: MigrationRequest = JSON.parse(req.body);

    let data;
    if (request.format === MigrationFormat.htmlFile)
      data = await importFromHTMLFile(user.id, request.data);
    else if (request.format === MigrationFormat.linkwarden)
      data = await importFromLinkwarden(user.id, request.data);
    else if (request.format === MigrationFormat.wallabag)
      data = await importFromWallabag(user.id, request.data);
    else if (request.format === MigrationFormat.omnivore)
      data = await importFromOmnivore(user.id, request.data);

    if (data) return res.status(data.status).json({ response: data.response });
  }
}
