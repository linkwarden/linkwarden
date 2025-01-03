import { ArchivedFormat, TokenExpiry } from "@/types/global";
import { AiTaggingMethod, LinksRouteTo } from "@prisma/client";
import { z } from "zod";

// const stringField = z.string({
//   errorMap: (e) => ({
//     message: `Invalid ${e.path}.`,
//   }),
// });

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const VerifyEmailSchema = z.object({
  token: z.string(),
});

export const PostTokenSchema = z.object({
  name: z.string().max(50),
  expires: z.nativeEnum(TokenExpiry),
});

export type PostTokenSchemaType = z.infer<typeof PostTokenSchema>;

export const PostUserSchema = () => {
  const emailEnabled =
    process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

  return z.object({
    name: z.string().trim().min(1).max(50).optional(),
    password: z.string().min(8).max(2048).optional(),
    email: emailEnabled
      ? z.string().trim().email().toLowerCase()
      : z.string().nullish(),
    username: emailEnabled
      ? z.string().optional()
      : z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9_-]{3,50}$/),
    invite: z.boolean().optional(),
  });
};

export const UpdateUserSchema = () => {
  const emailEnabled =
    process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

  return z.object({
    name: z.string().trim().min(1).max(50).optional(),
    email: emailEnabled
      ? z.string().trim().email().toLowerCase()
      : z.string().nullish(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_-]{3,30}$/),
    image: z.string().nullish(),
    password: z.string().min(8).max(2048).optional(),
    newPassword: z.string().min(8).max(2048).optional(),
    oldPassword: z.string().min(8).max(2048).optional(),
    archiveAsScreenshot: z.boolean().optional(),
    archiveAsPDF: z.boolean().optional(),
    archiveAsMonolith: z.boolean().optional(),
    archiveAsWaybackMachine: z.boolean().optional(),
    dashboardPinnedLinks: z.boolean().optional(),
    dashboardRecentLinks: z.boolean().optional(),
    aiTaggingMethod: z.nativeEnum(AiTaggingMethod).optional(),
    aiPredefinedTags: z.array(z.string().max(20).trim()).max(20).optional(),
    locale: z.string().max(20).optional(),
    isPrivate: z.boolean().optional(),
    preventDuplicateLinks: z.boolean().optional(),
    collectionOrder: z.array(z.number()).optional(),
    linksRouteTo: z.nativeEnum(LinksRouteTo).optional(),
    whitelistedUsers: z.array(z.string().max(50)).optional(),
    referredBy: z.string().max(100).nullish(),
  });
};

export const PostSessionSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  sessionName: z.string().trim().max(50).optional(),
});

export const PostLinkSchema = z.object({
  type: z.enum(["url", "pdf", "image"]).nullish(),
  url: z.string().trim().max(2048).url().optional(),
  name: z.string().trim().max(2048).optional(),
  description: z.string().trim().max(2048).optional(),
  image: z.enum(["jpeg", "png"]).optional(),
  collection: z
    .object({
      id: z.number().optional(),
      name: z.string().trim().max(2048).optional(),
    })
    .optional(),
  tags:
    z
      .array(
        z.object({
          id: z.number().optional(),
          name: z.string().trim().max(50),
        })
      )
      .optional() || [],
});

export type PostLinkSchemaType = z.infer<typeof PostLinkSchema>;

export const UpdateLinkSchema = z.object({
  id: z.number(),
  name: z.string().trim().max(2048).nullish(),
  url: z.string().trim().max(2048).nullish(),
  description: z.string().trim().max(2048).nullish(),
  icon: z.string().trim().max(50).nullish(),
  iconWeight: z.string().trim().max(50).nullish(),
  color: z.string().trim().max(50).nullish(),
  collection: z.object({
    id: z.number(),
    ownerId: z.number(),
  }),
  tags: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().trim().max(50),
    })
  ),
  pinnedBy: z
    .array(
      z
        .object({
          id: z.number().optional(),
        })
        .optional()
    )
    .optional(),
});

export type UpdateLinkSchemaType = z.infer<typeof UpdateLinkSchema>;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];
const NEXT_PUBLIC_MAX_FILE_BUFFER = Number(
  process.env.NEXT_PUBLIC_MAX_FILE_BUFFER || 10
);
const MAX_FILE_SIZE = NEXT_PUBLIC_MAX_FILE_BUFFER * 1024 * 1024;
export const UploadFileSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length == 1, "File is required.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is ${MAX_FILE_SIZE}MB.`
    )
    .refine(
      (files) => ACCEPTED_TYPES.includes(files?.[0]?.mimetype),
      `Only ${ACCEPTED_TYPES.join(", ")} files are accepted.`
    ),
  id: z.number(),
  format: z.nativeEnum(ArchivedFormat),
});

export const PostCollectionSchema = z.object({
  name: z.string().trim().max(2048),
  description: z.string().trim().max(2048).optional(),
  color: z.string().trim().max(50).optional(),
  icon: z.string().trim().max(50).optional(),
  iconWeight: z.string().trim().max(50).optional(),
  parentId: z.number().optional(),
});

export type PostCollectionSchemaType = z.infer<typeof PostCollectionSchema>;

export const UpdateCollectionSchema = z.object({
  id: z.number(),
  name: z.string().trim().max(2048),
  description: z.string().trim().max(2048).optional(),
  color: z.string().trim().max(50).optional(),
  isPublic: z.boolean().optional(),
  icon: z.string().trim().max(50).nullish(),
  iconWeight: z.string().trim().max(50).nullish(),
  parentId: z.union([z.number(), z.literal("root")]).nullish(),
  members: z.array(
    z.object({
      userId: z.number(),
      canCreate: z.boolean(),
      canUpdate: z.boolean(),
      canDelete: z.boolean(),
    })
  ),
});

export type UpdateCollectionSchemaType = z.infer<typeof UpdateCollectionSchema>;

export const UpdateTagSchema = z.object({
  name: z.string().trim().max(50),
});

export type UpdateTagSchemaType = z.infer<typeof UpdateTagSchema>;

export const PostRssSubscriptionSchema = z.object({
  name: z.string().max(50),
  url: z.string().url().max(2048),
  collectionId: z.number().optional(),
  collectionName: z.string().max(50).optional(),
});
