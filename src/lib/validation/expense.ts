import { z } from "zod";
import { ExpenseCategory } from "@/generated/prisma/enums";
import { entityIdSchema } from "@/lib/validation/common";

export const expenseAmountSchema = z
  .number()
  .finite()
  .positive()
  .max(9_999_999_999.99)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "El monto admite como máximo dos decimales.",
  );

export const createExpenseSchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    amount: expenseAmountSchema,
    currency: z.literal("PEN").optional(),
    description: z.string().trim().min(1).max(240),
    category: z.enum(ExpenseCategory),
    date: z.coerce.date(),
  })
  .strict();

export const expenseSummarySchema = z
  .object({
    projectId: entityIdSchema.nullable().optional(),
    timeframe: z.enum(["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL"]),
  })
  .strict();

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type ExpenseSummaryInput = z.input<typeof expenseSummarySchema>;

