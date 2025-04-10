import fs from "fs";
import path from "path";
import s3Client from "./s3Client";
import removeFile from "./removeFile";

export default async function moveFile(from: string, to: string) {
  if (s3Client) {
    const Bucket = process.env.SPACES_BUCKET_NAME;

    const copyParams = {
      Bucket: Bucket,
      CopySource: `/${Bucket}/${from}`,
      Key: to,
    };

    try {
      s3Client.copyObject(copyParams, async (err: unknown) => {
        if (err) {
          console.error("Error copying the object:", err);
        } else {
          await removeFile({ filePath: from });
        }
      });
    } catch (err) {
      console.log("Error:", err);
    }
  } else {
    const storagePath = process.env.STORAGE_FOLDER || "data";

    const directory = (file: string) =>
      path.join(process.cwd(), storagePath + "/" + file);

    fs.rename(directory(from), directory(to), (err) => {
      if (err) console.log("Error copying file:", err);
    });
  }
}
