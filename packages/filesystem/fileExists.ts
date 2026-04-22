import { HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import s3Client from "./s3Client";

export async function fileExists(filePath: string): Promise<boolean> {
  if (s3Client) {
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: process.env.SPACES_BUCKET_NAME!,
          Key: filePath,
        })
      );

      return true;
    } catch {
      return false;
    }
  }

  const storagePath = process.env.STORAGE_FOLDER || "data";
  const creationPath = path.join(process.cwd(), "../..", storagePath, filePath);

  return fs.existsSync(creationPath);
}
