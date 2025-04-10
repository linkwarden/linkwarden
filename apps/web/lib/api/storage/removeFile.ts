import fs from "fs";
import path from "path";
import s3Client from "./s3Client";
import { PutObjectCommandInput, DeleteObjectCommand } from "@aws-sdk/client-s3";

export default async function removeFile({ filePath }: { filePath: string }) {
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
    const creationPath = path.join(process.cwd(), storagePath + "/" + filePath);

    fs.unlink(creationPath, (err) => {
      if (err) console.log(err);
    });
  }
}
