import { z } from 'zod';

export const configSchema = z.object({
  baseUrl: z.string().url(),
  defaultCollection: z.string().optional().default('Unorganized'),
  // Optional so configs stored before this field existed stay valid.
  defaultCollectionId: z.number().optional(),
  apiKey: z.string(),
  syncBookmarks: z.boolean().optional().default(false),
});

export type configType = z.infer<typeof configSchema>;
