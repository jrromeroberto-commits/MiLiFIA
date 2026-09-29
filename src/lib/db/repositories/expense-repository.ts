import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

type ExpenseSummaryFilter = {
  projectId?: string | null;
  start?: Date;
  endExclusive?: Date;
};

function summaryWhere(userId: string, filter: ExpenseSummaryFilter) {
  return {
    userId,
    ...(filter.projectId ? { projectId: filter.projectId } : {}),
    ...(filter.start && filter.endExclusive
      ? { date: { gte: filter.start, lt: filter.endExclusive } }
      : {}),
  } satisfies Prisma.ExpenseWhereInput;
}

export const expenseRepository = {
  create(userId: string, data: Omit<Prisma.ExpenseUncheckedCreateInput, "userId">) {
    return db.expense.create({ data: { ...data, userId } });
  },

  findById(userId: string, id: string) {
    return db.expense.findFirst({ where: { id, userId } });
  },

  list(userId: string) {
    return db.expense.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  },

  async summarize(userId: string, filter: ExpenseSummaryFilter) {
    const where = summaryWhere(userId, filter);
    const [aggregate, byCategory] = await Promise.all([
      db.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

    return { aggregate, byCategory };
  },

  async delete(userId: string, id: string) {
    const result = await db.expense.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};

