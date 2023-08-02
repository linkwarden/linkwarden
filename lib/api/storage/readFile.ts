import {
  GetObjectCommand,
  GetObjectCommandInput,
  S3,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import s3Client from "./s3Client";
import util from "util";

type ReturnContentTypes =
  | "text/plain"
  | "image/jpeg"
  | "image/png"
  | "application/pdf";

export default async function readFile({ filePath }: { filePath: string }) {
  let contentType: ReturnContentTypes;

  if (s3Client) {
    const bucketParams: GetObjectCommandInput = {
      Bucket: process.env.BUCKET_NAME,
      Key: filePath,
    };

    try {
      let returnObject:
        | {
            file: Buffer | string;
            contentType: ReturnContentTypes;
          }
        | undefined;

      const headObjectAsync = util.promisify(
        s3Client.headObject.bind(s3Client)
      );

      try {
        await headObjectAsync(bucketParams);
      } catch (err) {
        contentType = "text/plain";

        returnObject = {
          file: "File not found, it's possible that the file you're looking for either doesn't exist or hasn't been created yet.",
          contentType,
        };
      }

      if (!returnObject) {
        const response = await (s3Client as S3).send(
          new GetObjectCommand(bucketParams)
        );
        const data = await streamToBuffer(response.Body);

        if (filePath.endsWith(".pdf")) {
          contentType = "application/pdf";
        } else if (filePath.endsWith(".png")) {
          contentType = "image/png";
        } else {
          // if (filePath.endsWith(".jpg"))
          contentType = "image/jpeg";
        }
        returnObject = { file: data as Buffer, contentType };
      }

      return returnObject;
    } catch (err) {
      console.log("Error:", err);

      contentType = "text/plain";
      return {
        file: "An internal occurred, please contact support.",
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
