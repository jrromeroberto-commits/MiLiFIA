import { z } from "zod";

export const MAX_PROJECT_FILE_BYTES = 8 * 1024 * 1024;

export const projectFileInputSchema = z
  .object({
    projectId: z.string().uuid(),
    originalName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    data: z.instanceof(Uint8Array).refine((value) => value.byteLength > 0, {
      message: "El archivo está vacío.",
    }).refine((value) => value.byteLength <= MAX_PROJECT_FILE_BYTES, {
      message: "El archivo supera el límite de 8 MB.",
    }),
  })
  .strict();

export const fileSearchInputSchema = z
  .object({
    query: z.string().trim().min(2).max(200),
    projectId: z.string().uuid().optional(),
  })
  .strict();

export type ProjectFileInput = z.input<typeof projectFileInputSchema>;
export type FileSearchInput = z.input<typeof fileSearchInputSchema>;
