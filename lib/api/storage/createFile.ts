import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import s3Client from "./s3Client";

export default async function createFile({
  filePath,
  data,
  isBase64,
}: {
  filePath: string;
  data: Buffer | string;
  isBase64?: boolean;
}) {
  if (s3Client) {
    const bucketParams: PutObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET_NAME,
      Key: filePath,
      Body: isBase64 ? Buffer.from(data as string, "base64") : data,
    };

    try {
      await s3Client.send(new PutObjectCommand(bucketParams));

      return true;
    } catch (err) {
      console.log("Error", err);
      return false;
    }
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";
    const creationPath = path.join(process.cwd(), storagePath + "/" + filePath);

    fs.writeFile(creationPath, data, isBase64 ? "base64" : {}, function (err) {
      if (err) console.log(err);
    });

    return true;
  }
}
