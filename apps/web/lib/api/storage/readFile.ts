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
  | "text/html"
  | "image/jpeg"
  | "image/png"
  | "application/pdf"
  | "application/json";

export default async function readFile(filePath: string) {
  let contentType: ReturnContentTypes;

  if (s3Client) {
    const bucketParams: GetObjectCommandInput = {
      Bucket: process.env.SPACES_BUCKET_NAME,
      Key: filePath,
    };

    try {
      let returnObject:
        | {
            file: Buffer | string;
            contentType: ReturnContentTypes;
            status: number;
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
          file: "File not found.",
          contentType,
          status: 400,
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
        } else if (filePath.endsWith("_readability.json")) {
          contentType = "application/json";
        } else if (filePath.endsWith(".html")) {
          contentType = "text/html";
        } else {
          // if (filePath.endsWith(".jpg"))
          contentType = "image/jpeg";
        }
        returnObject = { file: data as Buffer, contentType, status: 200 };
      }

      return returnObject;
    } catch (err) {
      console.log("Error:", err);

      contentType = "text/plain";
      return {
        file: "An internal occurred, please contact the support team.",
        contentType,
      };
    }
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";
    const creationPath = path.join(process.cwd(), storagePath + "/" + filePath);

    if (filePath.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filePath.endsWith(".png")) {
      contentType = "image/png";
    } else if (filePath.endsWith("_readability.json")) {
      contentType = "application/json";
    } else if (filePath.endsWith(".html")) {
      contentType = "text/html";
    } else {
      // if (filePath.endsWith(".jpg"))
      contentType = "image/jpeg";
    }

    if (!fs.existsSync(creationPath))
      return {
        file: "File not found.",
        contentType: "text/plain",
        status: 404,
      };
    else {
      const file = fs.readFileSync(creationPath);
      return { file, contentType, status: 200 };
    }
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

const fileNotFoundTemplate = `<!DOCTYPE html>
                              <html lang="en">
                              <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>File not found</title>
                              </head>
                              <body style="margin-left: auto; margin-right: auto; max-width: 500px; padding: 1rem; font-family: sans-serif; background-color: rgb(251, 251, 251);">
                                <h1>File not found</h1>
                                <h2>It is possible that the file you're looking for either doesn't exist or hasn't been created yet.</h2>
                                <h3>Some possible reasons are:</h3>
                                <ul>
                                  <li>You are trying to access a file too early, before it has been fully archived. If that's the case, refreshing the page might resolve the issue.</li>
                                  <li>The file doesn't exist either because it encountered an error while being archived, or it simply doesn't exist.</li>
                                </ul>
                              </body>
                              </html>`;
