import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { readFile, createFile, createFolder } from "@linkwarden/filesystem";
import { generatePreview } from "@linkwarden/lib";
import verifyToken from "@/lib/api/verifyToken";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";
import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import { UploadFileSchema } from "@linkwarden/lib/schemaValidation";
import isDemoMode from "@/lib/api/isDemoMode";
import getSuffixFromFormat from "@/lib/shared/getSuffixFromFormat";
import { ArchivedFormat } from "@linkwarden/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

/** ------------------ */
/** Helper Functions   */
/** ------------------ */

// Check whether user can create in the given collection
function userHasCreatePermission(
  collectionPermissions: any,
  userId: number
): boolean {
  if (!collectionPermissions) return false;
  const memberHasAccess = collectionPermissions.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canCreate
  );
  return collectionPermissions.ownerId === userId || Boolean(memberHasAccess);
}

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

// Retrieve collection if accessible (for both GET and file uploads/updates)
async function getAccessibleCollection(
  linkId: number,
  userId: number | undefined
) {
  return prisma.collection.findFirst({
    where: {
      links: {
        some: {
          id: linkId,
        },
      },
      OR: [
        { ownerId: userId || -1 },
        { members: { some: { userId: userId || -1 } } },
        { isPublic: true },
      ],
    },
  });
}

/** ------------------ */
/** Route Handlers     */
/** ------------------ */

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const linkId = Number(req.query.linkId);
  const format = Number(req.query.format);
  const isPreview = Boolean(req.query.preview);

  const suffix = getSuffixFromFormat(format);
  if (!linkId || !suffix) {
    return res.status(401).json({ response: "Invalid parameters." });
  }

  // Verify token => If present, get user ID
  const token = await verifyToken({ req });
  const userId = typeof token === "string" ? undefined : token?.id;

  // Check if user can access the collection
  const collection = await getAccessibleCollection(linkId, userId);
  if (!collection) {
    return res
      .status(401)
      .json({ response: "You don't have access to this collection." });
  }

  // Decide the file path
  const filePath = isPreview
    ? `archives/preview/${collection.id}/${linkId}.jpeg`
    : `archives/${collection.id}/${linkId + suffix}`;

  const { file, contentType, status } = await readFile(filePath);
  res.setHeader("Content-Type", contentType).status(status as number);
  return res.send(file);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  if (isDemoMode()) {
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  }

  const linkId = Number(req.query.linkId);
  const format = Number(req.query.format);
  const suffix = getSuffixFromFormat(format);
  const isPreview = Boolean(req.query.preview);

  if (!linkId || !suffix) {
    return res.status(401).json({ response: "Invalid parameters." });
  }

  // Verify user and collection permissions
  const user = await verifyUser({ req, res });
  if (!user) return; // verifyUser already handles the response on failure

  const collectionPermissions = await getPermission({
    userId: user.id,
    linkId,
  });
  if (
    !userHasCreatePermission(collectionPermissions, user.id) ||
    !collectionPermissions
  ) {
    return res.status(400).json({ response: "Collection is not accessible." });
  }

  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
  });

  if (!link) {
    return res.status(400).json({ response: "Link not found." });
  }

  // Ensure if the png already exists, the user is not trying to upload a jpeg (and vice versa)
  if (
    ((link.image?.endsWith("jpeg") && format === ArchivedFormat.png) ||
      (link.image?.endsWith("png") && format === ArchivedFormat.jpeg)) &&
    !isPreview
  ) {
    return res
      .status(400)
      .json({ response: "PNG or JPEG file already exists." });
  }

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

      // Validate input against Zod schema
      const dataValidation = UploadFileSchema.safeParse({
        id: linkId,
        format,
        file: files.file,
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
      ];
      const fileBuffer = validateFile(
        files.file[0],
        NEXT_PUBLIC_MAX_FILE_BUFFER,
        allowedMIMETypes
      );

      // Confirm the link still exists
      const linkStillExists = await prisma.link.findUnique({
        where: { id: linkId },
      });
      if (!linkStillExists) {
        throw new Error("Link not found.");
      }

      // Generate a preview if it's an image
      const { mimetype } = files.file[0];
      const isPDF = mimetype?.includes("pdf");
      const isImage = mimetype?.includes("image");

      console.log("isPDF", isPDF);

      if (isImage) {
        const collectionId = collectionPermissions.id;
        createFolder({ filePath: `archives/preview/${collectionId}` });
        await generatePreview(fileBuffer, collectionId, linkId);
      }

      if (!isPreview) {
        // Store the file
        await createFile({
          filePath: `archives/${collectionPermissions.id}/${linkId + suffix}`,
          data: fileBuffer,
        });
      }

      // Update link in DB
      const updateLink = await prisma.link.update({
        where: { id: linkId },
        data: {
          preview: isPDF ? "unavailable" : undefined,
          image:
            isImage && !isPreview
              ? `archives/${collectionPermissions.id}/${linkId + suffix}`
              : undefined,
          pdf: isPDF
            ? `archives/${collectionPermissions.id}/${linkId + suffix}`
            : undefined,
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
      case "GET":
        await handleGet(req, res);
        break;
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
