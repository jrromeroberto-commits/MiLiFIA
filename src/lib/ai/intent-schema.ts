import { z } from "zod";

export const lifeOSIntentNameSchema = z.enum([
  "create_task",
  "create_project",
  "create_idea",
  "create_note",
  "list_tasks",
  "list_projects",
  "list_ideas",
  "get_project_activity",
  "complete_task",
  "unknown",
]);

const nullableDescriptionSchema = z.string().trim().min(1).max(5_000).nullable();
const nullableProjectNameSchema = z.string().trim().min(1).max(160).nullable();
const clarificationQuestionSchema = z.string().trim().min(1).max(500).nullable();

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar el formato YYYY-MM-DD.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "La fecha no existe en el calendario.");

export const rawIntentResponseSchema = z
  .object({
    intent: lifeOSIntentNameSchema,
    title: z.string().trim().min(1).max(240).nullable(),
    name: z.string().trim().min(1).max(160).nullable(),
    description: nullableDescriptionSchema,
    content: z.string().trim().min(1).max(20_000).nullable(),
    projectName: nullableProjectNameSchema,
    dueDate: isoDateSchema.nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    taskStatus: z.enum(["PENDING", "COMPLETED", "ALL"]).nullable(),
    timeframe: z
      .enum(["TODAY", "TOMORROW", "THIS_WEEK", "OVERDUE", "ALL"])
      .nullable(),
    projectStatus: z
      .enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "ALL"])
      .nullable(),
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const createTaskIntentSchema = z
  .object({
    intent: z.literal("create_task"),
    title: z.string().trim().min(1).max(240),
    description: nullableDescriptionSchema,
    projectName: nullableProjectNameSchema,
    dueDate: isoDateSchema.nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const createProjectIntentSchema = z
  .object({
    intent: z.literal("create_project"),
    name: z.string().trim().min(1).max(160),
    description: nullableDescriptionSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const createIdeaIntentSchema = z
  .object({
    intent: z.literal("create_idea"),
    title: z.string().trim().min(1).max(240),
    description: nullableDescriptionSchema,
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const createNoteIntentSchema = z
  .object({
    intent: z.literal("create_note"),
    title: z.string().trim().min(1).max(240).nullable(),
    content: z.string().trim().min(1).max(20_000),
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const listTasksIntentSchema = z
  .object({
    intent: z.literal("list_tasks"),
    taskStatus: z.enum(["PENDING", "COMPLETED", "ALL"]).nullable(),
    timeframe: z
      .enum(["TODAY", "TOMORROW", "THIS_WEEK", "OVERDUE", "ALL"])
      .nullable(),
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const listProjectsIntentSchema = z
  .object({
    intent: z.literal("list_projects"),
    projectStatus: z
      .enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "ALL"])
      .nullable(),
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const listIdeasIntentSchema = z
  .object({
    intent: z.literal("list_ideas"),
    timeframe: z.enum(["TODAY", "THIS_WEEK", "ALL"]).nullable(),
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const getProjectActivityIntentSchema = z
  .object({
    intent: z.literal("get_project_activity"),
    projectName: z.string().trim().min(1).max(160),
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const completeTaskIntentSchema = z
  .object({
    intent: z.literal("complete_task"),
    title: z.string().trim().min(1).max(240),
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const unknownIntentSchema = z
  .object({
    intent: z.literal("unknown"),
    clarificationQuestion: z.string().trim().min(1).max(500),
  })
  .strict();

export const lifeOSIntentSchema = z.discriminatedUnion("intent", [
  createTaskIntentSchema,
  createProjectIntentSchema,
  createIdeaIntentSchema,
  createNoteIntentSchema,
  listTasksIntentSchema,
  listProjectsIntentSchema,
  listIdeasIntentSchema,
  getProjectActivityIntentSchema,
  completeTaskIntentSchema,
  unknownIntentSchema,
]);

export type LifeOSIntent = z.infer<typeof lifeOSIntentSchema>;
export type RawIntentResponse = z.infer<typeof rawIntentResponseSchema>;

export function toLifeOSIntent(raw: RawIntentResponse): LifeOSIntent {
  switch (raw.intent) {
    case "create_task":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        title: raw.title,
        description: raw.description,
        projectName: raw.projectName,
        dueDate: raw.dueDate,
        priority: raw.priority,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "create_project":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        name: raw.name,
        description: raw.description,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "create_idea":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        title: raw.title,
        description: raw.description,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "create_note":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        title: raw.title,
        content: raw.content,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "list_tasks":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        taskStatus: raw.taskStatus,
        timeframe: raw.timeframe,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "list_projects":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        projectStatus: raw.projectStatus,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "list_ideas":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        timeframe: raw.timeframe,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "get_project_activity":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "complete_task":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        title: raw.title,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "unknown":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        clarificationQuestion: raw.clarificationQuestion,
      });
  }
}
