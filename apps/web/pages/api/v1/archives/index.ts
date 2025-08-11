import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { createFile, createFolder } from "@linkwarden/filesystem";
import { generatePreview } from "@linkwarden/lib";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import { UploadFileSchema } from "@linkwarden/lib/schemaValidation";
import isDemoMode from "@/lib/api/isDemoMode";
import getSuffixFromFormat from "@/lib/shared/getSuffixFromFormat";
import setCollection from "@/lib/api/setCollection";

export const config = {
  api: {
    bodyParser: false,
  },
};

/** ------------------ */
/** Helper Functions   */
/** ------------------ */

// Ensure user does not exceed maximum link limit
async function verifyLinkLimit(userId: number) {
  const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER || 30000);
  const userLinkCount = await prisma.link.count({
    where: {
      collection: {
        ownerId: userId,
      },
    },
  });
  if (userLinkCount > MAX_LINKS_PER_USER) {
    throw new Error(
      `Each collection owner can only have a maximum of ${MAX_LINKS_PER_USER} Links.`
    );
  }
}

// Common validation for file size and type
function validateFile(
  file: formidable.File,
  maxMB: number,
  allowedTypes: string[]
) {
  if (!file || !allowedTypes.includes(file.mimetype || "")) {
    throw new Error(
      `Sorry, we couldn't process your file. Please ensure it's in [${allowedTypes.join(
        ", "
      )}] format and doesn't exceed ${maxMB}MB.`
    );
  }

  const fileBuffer = fs.readFileSync(file.filepath);
  if (Buffer.byteLength(fileBuffer as any) > 1024 * 1024 * maxMB) {
    throw new Error(
      `Sorry, we couldn't process your file. Please ensure it doesn't exceed ${maxMB}MB.`
    );
  }

  return fileBuffer;
}

/** ------------------ */
/** Route Handlers     */
/** ------------------ */

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  if (isDemoMode()) {
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  }

  const format = Number(req.query.format);
  const suffix = getSuffixFromFormat(format);
  const isPreview = Boolean(req.query.preview);

  if (!suffix) {
    return res.status(401).json({ response: "Missing format" });
  }

  // Verify user and collection permissions
  const user = await verifyUser({ req, res });
  if (!user) return; // verifyUser already handles the response on failure

  try {
    await verifyLinkLimit(user.id);
  } catch (err: any) {
    return res.status(400).json({ response: err.message });
  }

  const NEXT_PUBLIC_MAX_FILE_BUFFER = Number(
    process.env.NEXT_PUBLIC_MAX_FILE_BUFFER || 10
  );

  const form = formidable({
    maxFields: 1,
    maxFiles: 1,
    maxFileSize: NEXT_PUBLIC_MAX_FILE_BUFFER * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files.file || !files.file[0]) {
        throw new Error(
          `Sorry, we couldn't process your file. Please ensure it doesn't exceed ${NEXT_PUBLIC_MAX_FILE_BUFFER}MB.`
        );
      }

      const url = typeof fields.url === "string" ? fields.url : fields.url?.[0];

      // Validate input against Zod schema
      const dataValidation = UploadFileSchema.safeParse({
        format,
        file: files.file,
        url,
      });
      if (!dataValidation.success) {
        const issue = dataValidation.error.issues[0];
        throw new Error(`Error: ${issue.message} [${issue.path.join(", ")}]`);
      }

      // Check file type and size
      const allowedMIMETypes = [
        "application/pdf",
        "image/png",
        "image/jpg",
        "image/jpeg",
        "text/html",
      ];

      const fileBuffer = validateFile(
        files.file[0],
        NEXT_PUBLIC_MAX_FILE_BUFFER,
        allowedMIMETypes
      );

      const collection = await setCollection({
        userId: user.id,
      });

      if (!collection) {
        throw new Error("Collection not found.");
      }

      const link = await prisma.link.create({
        data: {
          createdBy: {
            connect: {
              id: user.id,
            },
          },
          collection: {
            connect: {
              id: collection.id,
            },
          },
          url,
        },
      });

      // Generate a preview if it's an image
      const { mimetype } = files.file[0];
      const isPDF = mimetype?.includes("pdf");
      const isImage = mimetype?.includes("image");
      const isHTML = mimetype === "text/html";

      if (isImage) {
        const collectionId = collection.id;
        createFolder({ filePath: `archives/preview/${collectionId}` });
        await generatePreview(fileBuffer, collectionId, link.id);
      }

      if (!isPreview) {
        // Store the file
        await createFile({
          filePath: `archives/${collection.id}/${link.id + suffix}`,
          data: fileBuffer,
        });
      }

      // Update link in DB
      const updateLink = await prisma.link.update({
        where: { id: link.id },
        data: {
          preview: isPDF ? "unavailable" : undefined,
          image:
            isImage && !isPreview
              ? `archives/${collection.id}/${link.id + suffix}`
              : undefined,
          pdf: isPDF
            ? `archives/${collection.id}/${link.id + suffix}`
            : undefined,
          monolith:
            isHTML && !isPreview
              ? `archives/${collection.id}/${link.id + suffix}`
              : undefined,
          clientSide: true,
          updatedAt: new Date().toISOString(),
        },
      });

      // Clean up temporary file
      fs.unlinkSync(files.file[0].filepath);

      return res.status(200).json({ response: updateLink });
    } catch (error: any) {
      return res.status(400).json({ response: error.message });
    }
  });
}

/** ------------------ */
/** Main API Handler   */
/** ------------------ */

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  try {
    switch (method) {
      case "POST":
        await handlePost(req, res);
        break;
      default:
        return res.status(405).json({ response: "Method not allowed" });
    }
  } catch (error: any) {
    return res.status(400).json({ response: error.message });
  }
}
