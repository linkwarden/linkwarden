import { z } from 'zod';

export const configSchema = z.object({
  baseUrl: z.string().url(),
  defaultCollection: z.string().optional().default('Unorganized'),
  apiKey: z.string(),
  syncBookmarks: z.boolean().optional().default(false),
  overrideBookmarkShortcut: z.boolean().optional().default(true),
});

export type configType = z.infer<typeof configSchema>;
