import type { NextApiRequest, NextApiResponse } from "next";
import exportData from "@/lib/api/controllers/migration/exportData";
import importFromHTMLFile from "@/lib/api/controllers/migration/importFromHTMLFile";
import importFromLinkwarden from "@/lib/api/controllers/migration/importFromLinkwarden";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import importFromWallabag from "@/lib/api/controllers/migration/importFromWallabag";
import importFromOmnivore from "@/lib/api/controllers/migration/importFromOmnivore";
import { Readable } from "stream";
import getSizeTransform from "stream-size";

export const config = {
  api: {
    // Disable body parser to be able to process binary uploads
    bodyParser: false,
  },
};

const IMPORT_SIZE_LIMIT_BYTES =
  parseInt(process.env.IMPORT_LIMIT ? process.env.IMPORT_LIMIT : "10") *
  1024 *
  1024;

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const unlimitedReadable: Readable = Readable.from(req);
    const importData = unlimitedReadable.pipe(
      getSizeTransform(IMPORT_SIZE_LIMIT_BYTES)
    ) as unknown as ReadableStream;
    const importFormatName = String(
      req.query.format
    ) as keyof typeof MigrationFormat;
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
