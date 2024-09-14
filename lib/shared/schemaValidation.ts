import { ArchivedFormat, TokenExpiry } from "@/types/global";
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
    name: z.string().trim().min(1).max(50),
    password: z.string().min(8),
    email: emailEnabled
      ? z.string().trim().email().toLowerCase()
      : z.string().optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-z0-9_-]{3,50}$/),
  });
};

export const PostSessionSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  sessionName: z.string().trim().max(50).optional(),
});

export const PostLinkSchema = z.object({
  type: z.enum(["url", "pdf", "image"]),
  url: z.string().trim().max(255).url().optional(),
  name: z.string().trim().max(255).optional(),
  description: z.string().trim().max(255).optional(),
  collection: z
    .object({
      id: z.number().optional(),
      name: z.string().trim().max(255).optional(),
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
  name: z.string().trim().max(255),
  description: z.string().trim().max(255).optional(),
  color: z.string().trim().max(7).optional(),
  icon: z.string().trim().max(50).optional(),
  iconWeight: z.string().trim().max(50).optional(),
  parentId: z.number().optional(),
});

export type PostCollectionSchemaType = z.infer<typeof PostCollectionSchema>;
