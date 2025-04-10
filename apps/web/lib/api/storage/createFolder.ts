import fs from "fs";
import path from "path";
import s3Client from "./s3Client";

export default function createFolder({ filePath }: { filePath: string }) {
  if (s3Client) {
    // Do nothing, S3 creates directories recursively
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";
    const creationPath = path.join(process.cwd(), storagePath + "/" + filePath);

    fs.mkdirSync(creationPath, { recursive: true });
  }
}
