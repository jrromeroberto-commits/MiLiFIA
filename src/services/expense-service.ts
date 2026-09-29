import "server-only";

import { expenseRepository } from "@/lib/db/repositories/expense-repository";
import {
  calendarDateUtc,
  localDateKey,
  monthRange,
  offsetDateKey,
  weekRange,
} from "@/lib/time/calendar";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createExpenseSchema,
  expenseSummarySchema,
  type CreateExpenseInput,
  type ExpenseSummaryInput,
} from "@/lib/validation/expense";
import { EntityNotFoundError } from "@/services/errors";
import { assertProjectOwnership } from "@/services/project-ownership";

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createExpenseSchema.parse(input);
  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  return expenseRepository.create(ownerId, {
    ...data,
    amount: data.amount.toFixed(2),
    currency: data.currency ?? "PEN",
    projectId: data.projectId ?? null,
  });
}

export function listExpenses(userId: string) {
  return expenseRepository.list(entityIdSchema.parse(userId));
}

export async function summarizeExpenses(
  userId: string,
  input: ExpenseSummaryInput,
  referenceDate = new Date(),
) {
  const ownerId = entityIdSchema.parse(userId);
  const data = expenseSummarySchema.parse(input);
  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  const today = localDateKey(referenceDate);
  const keys =
    data.timeframe === "TODAY"
      ? { start: today, end: today }
      : data.timeframe === "THIS_WEEK"
        ? weekRange(today)
        : data.timeframe === "THIS_MONTH"
          ? monthRange(today)
          : null;
  const filter = keys
    ? {
        projectId: data.projectId,
        start: calendarDateUtc(keys.start),
        endExclusive: calendarDateUtc(offsetDateKey(keys.end, 1)),
      }
    : { projectId: data.projectId };
  const summary = await expenseRepository.summarize(ownerId, filter);

  return {
    total: summary.aggregate._sum.amount?.toFixed(2) ?? "0.00",
    count: summary.aggregate._count._all,
    currency: "PEN" as const,
    categories: summary.byCategory.map((category) => ({
      category: category.category,
      total: category._sum.amount?.toFixed(2) ?? "0.00",
      count: category._count._all,
    })),
  };
}

export async function deleteExpense(userId: string, expenseId: string) {
  const deleted = await expenseRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(expenseId),
  );
  if (!deleted) throw new EntityNotFoundError("El gasto");
}

