import { z } from "zod";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import {
  entityIdSchema,
  optionalDescriptionSchema,
  requireAtLeastOneField,
} from "@/lib/validation/common";

export const createTaskSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: z.string().trim().min(1).max(240),
    description: optionalDescriptionSchema,
    priority: z.enum(TaskPriority).optional(),
    status: z.enum(TaskStatus).optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    title: z.string().trim().min(1).max(240).optional(),
    description: optionalDescriptionSchema,
    priority: z.enum(TaskPriority).optional(),
    status: z.enum(TaskStatus).optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, "Debes enviar al menos un campo.");

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
