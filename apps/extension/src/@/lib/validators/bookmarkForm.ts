import { z } from 'zod';

export const bookmarkFormSchema = z.object({
  url: z.string().url('This has to be a URL'),
  collection: z
    .object({
      id: z.number().optional(),
      ownerId: z.number().optional(),
      name: z.string(),
    })
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
      })
    )
    .nullish(),
  name: z.string(),
  description: z.string(),
  image: z.enum(['jpeg', 'png']).optional(),
});

export type bookmarkFormValues = z.infer<typeof bookmarkFormSchema>;
