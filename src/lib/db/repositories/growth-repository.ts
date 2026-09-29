import "server-only";

import type { GoalStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const growthRepository = {
  createHabit(
    userId: string,
    data: Omit<Prisma.HabitUncheckedCreateInput, "userId">,
  ) {
    return db.habit.create({ data: { ...data, userId } });
  },

  listHabits(userId: string) {
    return db.habit.findMany({
      where: { userId },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    });
  },

  createHabitLog(
    userId: string,
    data: Omit<Prisma.HabitLogUncheckedCreateInput, "userId">,
  ) {
    return db.habitLog.create({ data: { ...data, userId } });
  },

  listHabitLogs(userId: string, start?: Date, endExclusive?: Date) {
    return db.habitLog.findMany({
      where: {
        userId,
        ...(start && endExclusive
          ? { date: { gte: start, lt: endExclusive } }
          : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  },

  createGoal(
    userId: string,
    data: Omit<Prisma.GoalUncheckedCreateInput, "userId">,
  ) {
    return db.goal.create({ data: { ...data, userId } });
  },

  listGoals(userId: string) {
    return db.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
    });
  },

  async updateGoalStatus(userId: string, id: string, status: GoalStatus) {
    const result = await db.goal.updateMany({
      where: { id, userId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
    return result.count > 0;
  },
};
