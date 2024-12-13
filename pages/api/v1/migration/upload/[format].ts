import type { NextApiRequest, NextApiResponse } from "next";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import importFromOmnivore from "@/lib/api/controllers/migration/importFromOmnivore";
import { Readable } from "stream";
import getSizeTransform from "stream-size";
import formidable from "formidable";

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

  const unlimitedReadable: Readable = Readable.from(req);
  const importData = unlimitedReadable.pipe(
    getSizeTransform(IMPORT_SIZE_LIMIT_BYTES)
  );
  const importFormatName = String(
    req.query.format
  ) as keyof typeof MigrationFormat;
  const importFormat: MigrationFormat = MigrationFormat[importFormatName];

  let data;
  if (importFormat == MigrationFormat.omnivore)
    data = await importFromOmnivore(user.id, importData);

  if (data) return res.status(data.status).json({ response: data.response });
}