import { z } from "zod";
import {
  entityIdSchema,
  requireAtLeastOneField,
} from "@/lib/validation/common";

const optionalTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .nullable()
  .optional();

export const createNoteSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: optionalTitleSchema,
    content: z.string().trim().min(1).max(50_000),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: optionalTitleSchema,
    content: z.string().trim().min(1).max(50_000).optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, "Debes enviar al menos un campo.");

export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
