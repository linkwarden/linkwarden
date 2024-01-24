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
  }
  // else if (req.method === "POST") {
  //   const user = await verifyUser({ req, res });
  //   if (!user) return;

  //   const collectionPermissions = await getPermission({
  //     userId: user.id,
  //     linkId,
  //   });

  //   const memberHasAccess = collectionPermissions?.members.some(
  //     (e: UsersAndCollections) => e.userId === user.id && e.canCreate
  //   );

  //   if (!(collectionPermissions?.ownerId === user.id || memberHasAccess))
  //     return { response: "Collection is not accessible.", status: 401 };

  //   // await uploadHandler(linkId, )

  //   const MAX_UPLOAD_SIZE = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE);

  //   const form = formidable({
  //     maxFields: 1,
  //     maxFiles: 1,
  //     maxFileSize: MAX_UPLOAD_SIZE || 30 * 1048576,
  //   });

  //   form.parse(req, async (err, fields, files) => {
  //     const allowedMIMETypes = [
  //       "application/pdf",
  //       "image/png",
  //       "image/jpg",
  //       "image/jpeg",
  //     ];

  //     if (
  //       err ||
  //       !files.file ||
  //       !files.file[0] ||
  //       !allowedMIMETypes.includes(files.file[0].mimetype || "")
  //     ) {
  //       // Handle parsing error
  //       return res.status(500).json({
  //         response: `Sorry, we couldn't process your file. Please ensure it's a PDF, PNG, or JPG format and doesn't exceed ${MAX_UPLOAD_SIZE}MB.`,
  //       });
  //     } else {
  //       const fileBuffer = fs.readFileSync(files.file[0].filepath);

  //       const linkStillExists = await prisma.link.findUnique({
  //         where: { id: linkId },
  //       });

  //       if (linkStillExists) {
  //         await createFile({
  //           filePath: `archives/${collectionPermissions?.id}/${
  //             linkId + suffix
  //           }`,
  //           data: fileBuffer,
  //         });

  //         await prisma.link.update({
  //           where: { id: linkId },
  //           data: {
  //             image: `archives/${collectionPermissions?.id}/${
  //               linkId + suffix
  //             }`,
  //             lastPreserved: new Date().toISOString(),
  //           },
  //         });
  //       }

  //       fs.unlinkSync(files.file[0].filepath);
  //     }

  //     return res.status(200).json({
  //       response: files,
  //     });
  //   });
  // }
}
