import { S3 } from "@aws-sdk/client-s3";

const s3Client: S3 | undefined =
  process.env.SPACES_ENDPOINT &&
  process.env.SPACES_REGION &&
  process.env.SPACES_KEY &&
  process.env.SPACES_SECRET
    ? new S3({
        forcePathStyle: !!process.env.SPACES_FORCE_PATH_STYLE,
        endpoint: process.env.SPACES_ENDPOINT,
        region: process.env.SPACES_REGION,
        credentials: {
          accessKeyId: process.env.SPACES_KEY,
          secretAccessKey: process.env.SPACES_SECRET,
        },
      })
    : undefined;

export default s3Client;
