import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import s3Client from "./s3Client";

export async function createFile({
  filePath,
  data,
  isBase64 = false,
}: {
  filePath: string;
  data: Buffer | string;
  isBase64?: boolean;
}): Promise<boolean> {
  let bufferData: Buffer;
  if (isBase64 && typeof data === "string") {
    bufferData = Buffer.from(data, "base64");
  } else if (typeof data === "string") {
    bufferData = Buffer.from(data, "utf8");
  } else {
    bufferData = data;
  }

  if (s3Client) {
    const bucketParams: PutObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET_NAME!,
      Key: filePath,
      Body: new Uint8Array(bufferData),
    };

    try {
      await s3Client.send(new PutObjectCommand(bucketParams));
      return true;
    } catch (err) {
      console.error("Error uploading to S3:", err);
      return false;
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
      await fs.mkdir(path.dirname(creationPath), { recursive: true });
      await fs.writeFile(creationPath, new Uint8Array(bufferData));
      return true;
    } catch (err) {
      console.error("Error writing file:", err);
      return false;
    }
  }
}
