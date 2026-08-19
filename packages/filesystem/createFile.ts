import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import crypto from "crypto";
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
    const bytes = new Uint8Array(bufferData);

    let contentMD5: string | undefined;
    try {
      contentMD5 = crypto.createHash("md5").update(bytes).digest("base64");
    } catch (err) {
      console.warn("Skipping Content-MD5, unable to hash:", err);
    }

    const bucketParams: PutObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET_NAME!,
      Key: filePath,
      Body: bytes,
      ContentMD5: contentMD5,
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
