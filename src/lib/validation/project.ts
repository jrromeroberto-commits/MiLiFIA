import { z } from "zod";
import { ProjectStatus } from "@/generated/prisma/enums";
import {
  optionalDescriptionSchema,
  requireAtLeastOneField,
} from "@/lib/validation/common";

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: optionalDescriptionSchema,
    status: z.enum(ProjectStatus).optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    description: optionalDescriptionSchema,
    status: z.enum(ProjectStatus).optional(),
    archivedAt: z.coerce.date().nullable().optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, "Debes enviar al menos un campo.");

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
