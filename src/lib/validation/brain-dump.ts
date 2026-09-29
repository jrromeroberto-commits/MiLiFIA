import { z } from "zod";
import { isoDateSchema } from "@/lib/ai/intent-schema";

export const brainDumpItemTypeSchema = z.enum([
  "TASK",
  "PROJECT",
  "IDEA",
  "NOTE",
  "UNKNOWN",
]);

const nullableTitleSchema = z.string().trim().min(1).max(240).nullable();
const nullableNameSchema = z.string().trim().min(1).max(160).nullable();
const nullableDescriptionSchema = z.string().trim().min(1).max(5_000).nullable();
const nullableContentSchema = z.string().trim().min(1).max(20_000).nullable();
const nullableProjectNameSchema = z.string().trim().min(1).max(160).nullable();
const nullableQuestionSchema = z.string().trim().min(1).max(500).nullable();

export const rawBrainDumpItemSchema = z
  .object({
    itemType: brainDumpItemTypeSchema,
    sourceText: z.string().trim().min(1).max(5_000),
    title: nullableTitleSchema,
    name: nullableNameSchema,
    description: nullableDescriptionSchema,
    content: nullableContentSchema,
    projectName: nullableProjectNameSchema,
    dueDate: isoDateSchema.nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    clarificationQuestion: nullableQuestionSchema,
  })
  .strict()
  .superRefine((item, context) => {
    if ((item.itemType === "TASK" || item.itemType === "IDEA") && !item.title) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: "La propuesta necesita un título.",
      });
    }
    if (item.itemType === "PROJECT" && !item.name) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "El proyecto necesita un nombre.",
      });
    }
    if (item.itemType === "NOTE" && !item.content) {
      context.addIssue({
        code: "custom",
        path: ["content"],
        message: "La nota necesita contenido.",
      });
    }
    if (item.itemType === "UNKNOWN" && !item.clarificationQuestion) {
      context.addIssue({
        code: "custom",
        path: ["clarificationQuestion"],
        message: "Una propuesta ambigua necesita una pregunta.",
      });
    }
  });

export const rawBrainDumpResponseSchema = z
  .object({ items: z.array(rawBrainDumpItemSchema).min(1).max(20) })
  .strict();

export const brainDumpDraftSchema = rawBrainDumpItemSchema
  .safeExtend({ id: z.string().trim().min(1).max(100) })
  .strict();

export const confirmedBrainDumpItemSchema = brainDumpDraftSchema.refine(
  (item) => item.itemType !== "UNKNOWN",
  {
    path: ["itemType"],
    message: "Aclara o excluye las propuestas pendientes antes de guardar.",
  },
);

export const confirmedBrainDumpSchema = z
  .array(confirmedBrainDumpItemSchema)
  .min(1)
  .max(20);

export const brainDumpTextSchema = z.string().trim().min(10).max(20_000);

export type BrainDumpDraft = z.infer<typeof brainDumpDraftSchema>;
export type ConfirmedBrainDumpItem = z.infer<typeof confirmedBrainDumpItemSchema>;
