import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@linkwarden/types/global";
import verifyUser from "@/lib/api/verifyUser";
import importFromWallabag from "@/lib/api/controllers/migration/importFromWallabag";
import importFromOmnivore from "@/lib/api/controllers/migration/importFromOmnivore";
import importFromPocket from "@/lib/api/controllers/migration/importFromPocket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseJsonStream = (
  req: NextApiRequest,
  limitMb: number
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalLength = 0;
    const limitBytes = limitMb * 1024 * 1024;

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      totalLength += chunk.length;

      if (totalLength > limitBytes) {
        reject(new Error("Payload Too Large"));
      }
    });

    req.on("end", () => {
      try {
        const bodyString = Buffer.concat(chunks as any).toString("utf8");
        resolve(bodyString ? JSON.parse(bodyString) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", (err) => reject(err));
  });
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

    let request: MigrationRequest;

    try {
      const limitMb = process.env.IMPORT_LIMIT
        ? parseInt(process.env.IMPORT_LIMIT, 10)
        : 10;

      request = await parseJsonStream(req, limitMb);
    } catch (error: any) {
      if (error.message === "Payload Too Large") {
        return res.status(413).json({
          response: `Import file exceeds the ${
            process.env.IMPORT_LIMIT || 10
          }MB size limit.`,
        });
      }
      return res
        .status(400)
        .json({ response: "Invalid request body provided." });
    }

    let data;
    if (request.format === MigrationFormat.htmlFile)
      data = await importFromHTMLFile(user.id, request.data);
    else if (request.format === MigrationFormat.linkwarden)
      data = await importFromLinkwarden(user.id, request.data);
    else if (request.format === MigrationFormat.wallabag)
      data = await importFromWallabag(user.id, request.data);
    else if (request.format === MigrationFormat.omnivore)
      data = await importFromOmnivore(user.id, request.data);
    else if (request.format === MigrationFormat.pocket)
      data = await importFromPocket(user.id, request.data);

    if (data) return res.status(data.status).json({ response: data.response });
  }
}
