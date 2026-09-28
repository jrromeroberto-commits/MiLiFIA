import { z } from "zod";
import { IdeaStatus } from "@/generated/prisma/enums";
import {
  entityIdSchema,
  optionalDescriptionSchema,
  requireAtLeastOneField,
} from "@/lib/validation/common";

export const createIdeaSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: z.string().trim().min(1).max(240),
    description: optionalDescriptionSchema,
    status: z.enum(IdeaStatus).optional(),
  })
  .strict();

export const updateIdeaSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: z.string().trim().min(1).max(240).optional(),
    description: optionalDescriptionSchema,
    status: z.enum(IdeaStatus).optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, "Debes enviar al menos un campo.");

export type CreateIdeaInput = z.input<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.input<typeof updateIdeaSchema>;
