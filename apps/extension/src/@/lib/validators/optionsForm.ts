import { z } from 'zod';

export const optionsFormSchema = z.object({
  baseUrl: z.string().url('This has to be a URL'),
  username: z.string(),
  password: z.string(),
  syncBookmarks: z.boolean().default(false),
  defaultCollection: z.string().optional().default('Unorganized'),
  useApiKey: z.boolean().default(false),
  apiKey: z.string().optional(),
  method: z.enum(['username', 'apiKey']).default('username'),
});

export type optionsFormValues = z.infer<typeof optionsFormSchema>;

// Zod 4 distinguishes the schema's input from its output: fields with
// `.default()` are optional going in and guaranteed coming out. react-hook-form
// needs both, so `useForm` is parameterised with the input and the output.
export type optionsFormInput = z.input<typeof optionsFormSchema>;
