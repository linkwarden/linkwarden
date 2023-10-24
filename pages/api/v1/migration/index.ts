import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@/types/global";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: process.env.IMPORT_SIZE_LIMIT || "2mb",
    },
  },
};

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  if (req.method === "GET") {
    const data = await exportData(session.user.id);

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
      data = await importFromHTMLFile(session.user.id, request.data);

    if (request.format === MigrationFormat.linkwarden)
      data = await importFromLinkwarden(session.user.id, request.data);

    if (data) return res.status(data.status).json({ response: data.response });
  }
}
