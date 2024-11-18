import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import importFromWallabag from "@/lib/api/controllers/migration/importFromWallabag";
import importFromOmnivore from "@/lib/api/controllers/migration/importFromOmnivore";
import { Readable } from 'stream';

export const config = {
  api: {
    // bodyParser: {
    //   sizeLimit: process.env.IMPORT_LIMIT
    //     ? process.env.IMPORT_LIMIT + "mb"
    //     : "10mb",
    // },
    bodyParser: false,
  },
};

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const importData: Readable = Readable.from(req); // TODO have something like a limit reader
    console.log(`received body type ${typeof importData}`);
    const importFormatName = String(req.query.format) as keyof typeof MigrationFormat;
    const importFormat: MigrationFormat = MigrationFormat[importFormatName];

    let data;
    if (importFormat === MigrationFormat.htmlFile)
      data = await importFromHTMLFile(user.id, importData);
    else if (importFormat === MigrationFormat.linkwarden)
      data = await importFromLinkwarden(user.id, importData);
    else if (importFormat === MigrationFormat.wallabag)
      data = await importFromWallabag(user.id, importData);
    else if (importFormat == MigrationFormat.omnivore)
      data = await importFromOmnivore(user.id, importData);

    if (data) return res.status(data.status).json({ response: data.response });
  }
}
