import type { NextApiRequest, NextApiResponse } from "next";
import readFile from "@/lib/api/storage/readFile";
import { prisma } from "@/lib/api/db";
import { ArchivedFormat } from "@/types/global";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@prisma/client";
import formidable from "formidable";
import createFile from "@/lib/api/storage/createFile";
import fs from "fs";
import verifyToken from "@/lib/api/verifyToken";
import generatePreview from "@/lib/api/generatePreview";
import createFolder from "@/lib/api/storage/createFolder";
import { UploadFileSchema } from "@/lib/shared/schemaValidation";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const linkId = Number(req.query.linkId);
  const format = Number(req.query.format);
  const isPreview = Boolean(req.query.preview);

  let suffix: string;

  if (format === ArchivedFormat.png) suffix = ".png";
  else if (format === ArchivedFormat.jpeg) suffix = ".jpeg";
  else if (format === ArchivedFormat.pdf) suffix = ".pdf";
  else if (format === ArchivedFormat.readability) suffix = "_readability.json";
  else if (format === ArchivedFormat.monolith) suffix = ".html";

  //@ts-ignore
  if (!linkId || !suffix)
    return res.status(401).json({ response: "Invalid parameters." });

  if (req.method === "GET") {
    const token = await verifyToken({ req });
    const userId = typeof token === "string" ? undefined : token?.id;

    const collectionIsAccessible = await prisma.collection.findFirst({
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

    if (!collectionIsAccessible)
      return res
        .status(401)
        .json({ response: "You don't have access to this collection." });

    if (isPreview) {
      const { file, contentType, status } = await readFile(
        `archives/preview/${collectionIsAccessible.id}/${linkId}.jpeg`
      );

      res.setHeader("Content-Type", contentType).status(status as number);

      return res.send(file);
    } else {
      const { file, contentType, status } = await readFile(
        `archives/${collectionIsAccessible.id}/${linkId + suffix}`
      );

      res.setHeader("Content-Type", contentType).status(status as number);

      return res.send(file);
    }
  } else if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const user = await verifyUser({ req, res });
    if (!user) return;

    const collectionPermissions = await getPermission({
      userId: user.id,
      linkId,
    });

    if (!collectionPermissions)
      return res.status(400).json({
        response: "Collection is not accessible.",
      });

    const memberHasAccess = collectionPermissions.members.some(
      (e: UsersAndCollections) => e.userId === user.id && e.canCreate
    );

    if (!(collectionPermissions.ownerId === user.id || memberHasAccess))
      return res.status(400).json({
        response: "Collection is not accessible.",
      });

    const MAX_LINKS_PER_USER = Number(process.env.MAX_LINKS_PER_USER || 30000);

    const numberOfLinksTheUserHas = await prisma.link.count({
      where: {
        collection: {
          ownerId: user.id,
        },
      },
    });

    if (numberOfLinksTheUserHas > MAX_LINKS_PER_USER)
      return res.status(400).json({
        response: `Each collection owner can only have a maximum of ${MAX_LINKS_PER_USER} Links.`,
      });

    const NEXT_PUBLIC_MAX_FILE_BUFFER = Number(
      process.env.NEXT_PUBLIC_MAX_FILE_BUFFER || 10
    );

    const form = formidable({
      maxFields: 1,
      maxFiles: 1,
      maxFileSize: NEXT_PUBLIC_MAX_FILE_BUFFER * 1024 * 1024,
    });

    form.parse(req, async (err, fields, files) => {
      const allowedMIMETypes = [
        "application/pdf",
        "image/png",
        "image/jpg",
        "image/jpeg",
      ];

      const dataValidation = UploadFileSchema.safeParse({
        id: Number(req.query.linkId),
        format: Number(req.query.format),
        file: files.file,
      });

      if (!dataValidation.success) {
        return res.status(400).json({
          response: `Error: ${
            dataValidation.error.issues[0].message
          } [${dataValidation.error.issues[0].path.join(", ")}]`,
        });
      }

      if (
        err ||
        !files.file ||
        !files.file[0] ||
        !allowedMIMETypes.includes(files.file[0].mimetype || "")
      ) {
        // Handle parsing error
        return res.status(400).json({
          response: `Sorry, we couldn't process your file. Please ensure it's a PDF, PNG, or JPG format and doesn't exceed ${NEXT_PUBLIC_MAX_FILE_BUFFER}MB.`,
        });
      } else {
        const fileBuffer = fs.readFileSync(files.file[0].filepath);

        if (
          Buffer.byteLength(fileBuffer) >
          1024 * 1024 * Number(NEXT_PUBLIC_MAX_FILE_BUFFER)
        )
          return res.status(400).json({
            response: `Sorry, we couldn't process your file. Please ensure it's a PDF, PNG, or JPG format and doesn't exceed ${NEXT_PUBLIC_MAX_FILE_BUFFER}MB.`,
          });

        const linkStillExists = await prisma.link.findUnique({
          where: { id: linkId },
        });

        const { mimetype } = files.file[0];
        const isPDF = mimetype?.includes("pdf");
        const isImage = mimetype?.includes("image");

        if (linkStillExists && isImage) {
          const collectionId = collectionPermissions.id;
          createFolder({
            filePath: `archives/preview/${collectionId}`,
          });

          generatePreview(fileBuffer, collectionId, linkId);
        }

        if (linkStillExists) {
          await createFile({
            filePath: `archives/${collectionPermissions.id}/${linkId + suffix}`,
            data: fileBuffer,
          });

          await prisma.link.update({
            where: { id: linkId },
            data: {
              preview: isPDF ? "unavailable" : undefined,
              image: isImage
                ? `archives/${collectionPermissions.id}/${linkId + suffix}`
                : null,
              pdf: isPDF
                ? `archives/${collectionPermissions.id}/${linkId + suffix}`
                : null,
              lastPreserved: new Date().toISOString(),
            },
          });
        }

        fs.unlinkSync(files.file[0].filepath);
      }

      return res.status(200).json({
        response: files,
      });
    });
  }
  // To update the link preview
  else if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const user = await verifyUser({ req, res });
    if (!user) return;

    const collectionPermissions = await getPermission({
      userId: user.id,
      linkId,
    });

    if (!collectionPermissions)
      return res.status(400).json({
        response: "Collection is not accessible.",
      });

    const memberHasAccess = collectionPermissions.members.some(
      (e: UsersAndCollections) => e.userId === user.id && e.canCreate
    );

    if (!(collectionPermissions.ownerId === user.id || memberHasAccess))
      return res.status(400).json({
        response: "Collection is not accessible.",
      });

    const NEXT_PUBLIC_MAX_FILE_BUFFER = Number(
      process.env.NEXT_PUBLIC_MAX_FILE_BUFFER || 10
    );

    const form = formidable({
      maxFields: 1,
      maxFiles: 1,
      maxFileSize: NEXT_PUBLIC_MAX_FILE_BUFFER * 1024 * 1024,
    });

    form.parse(req, async (err, fields, files) => {
      const allowedMIMETypes = ["image/png", "image/jpg", "image/jpeg"];

      if (
        err ||
        !files.file ||
        !files.file[0] ||
        !allowedMIMETypes.includes(files.file[0].mimetype || "")
      ) {
        // Handle parsing error
        return res.status(400).json({
          response: `Sorry, we couldn't process your file. Please ensure it's a PDF, PNG, or JPG format and doesn't exceed ${NEXT_PUBLIC_MAX_FILE_BUFFER}MB.`,
        });
      } else {
        const fileBuffer = fs.readFileSync(files.file[0].filepath);

        if (
          Buffer.byteLength(fileBuffer) >
          1024 * 1024 * Number(NEXT_PUBLIC_MAX_FILE_BUFFER)
        )
          return res.status(400).json({
            response: `Sorry, we couldn't process your file. Please ensure it's a PNG, or JPG format and doesn't exceed ${NEXT_PUBLIC_MAX_FILE_BUFFER}MB.`,
          });

        const linkStillExists = await prisma.link.update({
          where: { id: linkId },
          data: {
            updatedAt: new Date(),
          },
        });

        if (linkStillExists) {
          const collectionId = collectionPermissions.id;
          createFolder({
            filePath: `archives/preview/${collectionId}`,
          });

          await generatePreview(fileBuffer, collectionId, linkId);
        }

        fs.unlinkSync(files.file[0].filepath);

        if (linkStillExists)
          return res.status(200).json({
            response: linkStillExists,
          });
        else return res.status(400).json({ response: "Link not found." });
      }
    });
  }
}
