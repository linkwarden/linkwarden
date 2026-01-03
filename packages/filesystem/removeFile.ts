import fs from "fs/promises";
import path from "path";
import s3Client from "./s3Client";
import { PutObjectCommandInput, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function removeFile({ filePath }: { filePath: string }) {
  if (s3Client) {
    const bucketParams: PutObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET_NAME,
      Key: filePath,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(bucketParams));
    } catch (err) {
      console.log("Error", err);
    }
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";
    const creationPath = path.join(
      process.cwd(),
      "../..",
      storagePath,
      filePath
    );

    try {
      await fs.unlink(creationPath);
    } catch (err) {
      // Ignore "File not found" errors as they are expected when 
      // cleaning up multiple possible extensions, but log for debugging.
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
        console.debug(
          `removeFile: file not found at path "${creationPath}", ` +
            `skipping delete (code=${(err as NodeJS.ErrnoException).code})`
        );
        return;
      }
    }
  }
}
