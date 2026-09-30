import { z } from "zod";
import { expenseAmountSchema } from "@/lib/validation/expense";

export const lifeOSIntentNameSchema = z.enum([
  "create_task",
  "create_project",
  "create_idea",
  "create_note",
  "list_tasks",
  "list_projects",
  "list_ideas",
  "get_project_activity",
  "create_expense",
  "summarize_expenses",
  "create_habit",
  "log_habit",
  "create_goal",
  "complete_task",
  "search_files",
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
    amount: expenseAmountSchema.nullable(),
    currency: z.literal("PEN").nullable(),
    expenseCategory: z
      .enum([
        "FOOD",
        "TRANSPORT",
        "HOUSING",
        "SERVICES",
        "SOFTWARE",
        "HEALTH",
        "EDUCATION",
        "ENTERTAINMENT",
        "SHOPPING",
        "OTHER",
      ])
      .nullable(),
    expenseDate: isoDateSchema.nullable(),
    expenseTimeframe: z
      .enum(["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL"])
      .nullable(),
    expenseAggregation: z.enum(["TOTAL", "BY_CATEGORY"]).nullable(),
    habitName: z.string().trim().min(1).max(160).nullable(),
    habitFrequency: z.enum(["DAILY", "WEEKLY"]).nullable(),
    habitTargetCount: z.number().int().min(1).max(365).nullable(),
    habitValue: z.number().positive().max(1_000_000).nullable(),
    habitUnit: z
      .enum(["SESSIONS", "MINUTES", "HOURS", "KILOMETERS", "PAGES"])
      .nullable(),
    habitDate: isoDateSchema.nullable(),
    goalTitle: z.string().trim().min(1).max(240).nullable(),
    goalTargetDate: isoDateSchema.nullable(),
    fileQuery: z.string().trim().min(2).max(200).nullable(),
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

const expenseCategorySchema = z.enum([
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "SERVICES",
  "SOFTWARE",
  "HEALTH",
  "EDUCATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "OTHER",
]);

const createExpenseIntentSchema = z
  .object({
    intent: z.literal("create_expense"),
    amount: expenseAmountSchema,
    currency: z.literal("PEN"),
    description: z.string().trim().min(1).max(240),
    expenseCategory: expenseCategorySchema,
    expenseDate: isoDateSchema,
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const summarizeExpensesIntentSchema = z
  .object({
    intent: z.literal("summarize_expenses"),
    expenseTimeframe: z.enum(["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL"]),
    expenseAggregation: z.enum(["TOTAL", "BY_CATEGORY"]),
    projectName: nullableProjectNameSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const habitUnitSchema = z.enum([
  "SESSIONS",
  "MINUTES",
  "HOURS",
  "KILOMETERS",
  "PAGES",
]);

const createHabitIntentSchema = z
  .object({
    intent: z.literal("create_habit"),
    habitName: z.string().trim().min(1).max(160),
    description: nullableDescriptionSchema,
    habitFrequency: z.enum(["DAILY", "WEEKLY"]),
    habitTargetCount: z.number().int().min(1).max(365),
    habitUnit: habitUnitSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const logHabitIntentSchema = z
  .object({
    intent: z.literal("log_habit"),
    habitName: z.string().trim().min(1).max(160),
    habitValue: z.number().positive().max(1_000_000),
    habitUnit: habitUnitSchema,
    habitDate: isoDateSchema,
    clarificationQuestion: clarificationQuestionSchema,
  })
  .strict();

const createGoalIntentSchema = z
  .object({
    intent: z.literal("create_goal"),
    goalTitle: z.string().trim().min(1).max(240),
    description: nullableDescriptionSchema,
    goalTargetDate: isoDateSchema.nullable(),
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

const searchFilesIntentSchema = z
  .object({
    intent: z.literal("search_files"),
    fileQuery: z.string().trim().min(2).max(200),
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
  createExpenseIntentSchema,
  summarizeExpensesIntentSchema,
  createHabitIntentSchema,
  logHabitIntentSchema,
  createGoalIntentSchema,
  completeTaskIntentSchema,
  searchFilesIntentSchema,
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
    case "create_expense":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        amount: raw.amount,
        currency: raw.currency,
        description: raw.description,
        expenseCategory: raw.expenseCategory,
        expenseDate: raw.expenseDate,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "summarize_expenses":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        expenseTimeframe: raw.expenseTimeframe,
        expenseAggregation: raw.expenseAggregation,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "create_habit":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        habitName: raw.habitName,
        description: raw.description,
        habitFrequency: raw.habitFrequency,
        habitTargetCount: raw.habitTargetCount,
        habitUnit: raw.habitUnit,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "log_habit":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        habitName: raw.habitName,
        habitValue: raw.habitValue,
        habitUnit: raw.habitUnit,
        habitDate: raw.habitDate,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "create_goal":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        goalTitle: raw.goalTitle,
        description: raw.description,
        goalTargetDate: raw.goalTargetDate,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "complete_task":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        title: raw.title,
        projectName: raw.projectName,
        clarificationQuestion: raw.clarificationQuestion,
      });
    case "search_files":
      return lifeOSIntentSchema.parse({
        intent: raw.intent,
        fileQuery: raw.fileQuery,
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
