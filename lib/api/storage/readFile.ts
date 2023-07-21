import { GetObjectCommand, GetObjectCommandInput } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import s3Client from "./s3Client";

export default async function readFile({ filePath }: { filePath: string }) {
  let contentType:
    | "text/plain"
    | "image/jpeg"
    | "image/png"
    | "application/pdf";

  if (s3Client) {
    const bucketParams: GetObjectCommandInput = {
      Bucket: process.env.BUCKET_NAME,
      Key: filePath,
    };

    try {
      const response = await s3Client.send(new GetObjectCommand(bucketParams));
      const data = await streamToBuffer(response.Body);

      if (filePath.endsWith(".pdf")) {
        contentType = "application/pdf";
      } else if (filePath.endsWith(".png")) {
        contentType = "image/png";
      } else {
        // if (filePath.endsWith(".jpg"))
        contentType = "image/jpeg";
      }

      return { file: data, contentType };
    } catch (err) {
      console.log("Error", err);

      contentType = "text/plain";

      return {
        file: "File not found, it's possible that the file you're looking for either doesn't exist or hasn't been created yet.",
        contentType,
      };
    }
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";
    const creationPath = path.join(process.cwd(), storagePath + "/" + filePath);

    const file = fs.existsSync(creationPath)
      ? fs.readFileSync(creationPath)
      : "File not found, it's possible that the file you're looking for either doesn't exist or hasn't been created yet.";

    if (file.toString().startsWith("File not found")) {
      contentType = "text/plain";
    } else if (filePath.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filePath.endsWith(".png")) {
      contentType = "image/png";
    } else {
      // if (filePath.endsWith(".jpg"))
      contentType = "image/jpeg";
    }

    return { file, contentType };
  }
}

// Turn the file's body into buffer
const streamToBuffer = (stream: any) => {
  const chunks: any = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err: any) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};
