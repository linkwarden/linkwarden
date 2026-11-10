import { S3 } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client: S3 | undefined =
  process.env.SPACES_ENDPOINT &&
  process.env.SPACES_REGION &&
  process.env.SPACES_KEY &&
  process.env.SPACES_SECRET
    ? new S3({
        forcePathStyle: process.env.SPACES_FORCE_PATH_STYLE === "true",
        endpoint: process.env.SPACES_ENDPOINT,
        region: process.env.SPACES_REGION,
        maxAttempts: 10,
        credentials: {
          accessKeyId: process.env.SPACES_KEY,
          secretAccessKey: process.env.SPACES_SECRET,
        },
        // Only send and check checksums where S3 requires them, like the SDK did
        // before v3.729.0, since some S3-compatible services reject the new ones
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      })
    : undefined;

// DeleteObjects always needs a checksum, and the SDK now sends CRC32 where it
// used to send Content-MD5, which some S3-compatible services don't accept.
// Based on AWS's fallback, but placed at the end of the build step (where the
// checksum headers are added) so commands without checksums aren't affected.
// https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/MD5_FALLBACK.md
s3Client?.middlewareStack.add(
  (next: (args: any) => Promise<any>, context: { commandName?: string }) =>
    async (args: { request: any }) => {
      const request = args.request;

      if (context.commandName === "DeleteObjectsCommand" && request?.body) {
        for (const header of Object.keys(request.headers)) {
          const name = header.toLowerCase();
          if (
            name.startsWith("x-amz-checksum-") ||
            name.startsWith("x-amz-sdk-checksum-")
          )
            delete request.headers[header];
        }

        request.headers["Content-MD5"] = crypto
          .createHash("md5")
          .update(new Uint8Array(Buffer.from(request.body)))
          .digest("base64");
      }

      return next(args);
    },
  { step: "build", priority: "low", name: "deleteObjectsContentMD5" }
);

export default s3Client;
