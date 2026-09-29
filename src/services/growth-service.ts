import "server-only";

import { growthRepository } from "@/lib/db/repositories/growth-repository";
import {
  calendarDateUtc,
  localDateKey,
  offsetDateKey,
  weekRange,
} from "@/lib/time/calendar";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createGoalSchema,
  createHabitSchema,
  logHabitSchema,
  type CreateGoalInput,
  type CreateHabitInput,
  type LogHabitInput,
} from "@/lib/validation/growth";
import { EntityNotFoundError } from "@/services/errors";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

export class GrowthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthValidationError";
  }
}

export async function createHabit(userId: string, input: CreateHabitInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createHabitSchema.parse(input);
  const habits = await growthRepository.listHabits(ownerId);
  const existing = habits.find(
    (habit) => normalize(habit.name) === normalize(data.name),
  );
  if (existing) return { habit: existing, created: false };

  const habit = await growthRepository.createHabit(ownerId, {
    name: data.name,
    description: data.description ?? null,
    period: data.period,
    targetCount: data.targetCount ?? null,
    unit: data.unit,
  });
  return { habit, created: true };
}

export async function resolveHabit(userId: string, name: string) {
  const ownerId = entityIdSchema.parse(userId);
  const expected = normalize(name);
  const habits = (await growthRepository.listHabits(ownerId)).filter(
    (habit) => habit.active,
  );
  const exact = habits.filter((habit) => normalize(habit.name) === expected);
  if (exact.length === 1) return exact[0];
  const partial = habits.filter(
    (habit) =>
      normalize(habit.name).includes(expected) ||
      expected.includes(normalize(habit.name)),
  );
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    throw new GrowthValidationError(
      `Encontré varios hábitos parecidos: ${partial.map((habit) => habit.name).join(", ")}. ¿Cuál deseas registrar?`,
    );
  }
  return null;
}

export async function logHabit(userId: string, input: LogHabitInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = logHabitSchema.parse(input);
  const habit = (await growthRepository.listHabits(ownerId)).find(
    (item) => item.id === data.habitId && item.active,
  );
  if (!habit) throw new EntityNotFoundError("El hábito");

  const log = await growthRepository.createHabitLog(ownerId, {
    habitId: habit.id,
    value: data.value.toFixed(2),
    date: data.date,
    note: data.note ?? null,
  });
  return { habit, log };
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createGoalSchema.parse(input);
  return growthRepository.createGoal(ownerId, {
    title: data.title,
    description: data.description ?? null,
    targetDate: data.targetDate ?? null,
  });
}

export async function completeGoal(userId: string, goalId: string) {
  const updated = await growthRepository.updateGoalStatus(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(goalId),
    "COMPLETED",
  );
  if (!updated) throw new EntityNotFoundError("La meta");
}

export async function getGrowthDashboard(
  userId: string,
  referenceDate = new Date(),
) {
  const ownerId = entityIdSchema.parse(userId);
  const today = localDateKey(referenceDate);
  const week = weekRange(today);
  const [habits, logs, goals] = await Promise.all([
    growthRepository.listHabits(ownerId),
    growthRepository.listHabitLogs(
      ownerId,
      calendarDateUtc(week.start),
      calendarDateUtc(offsetDateKey(week.end, 1)),
    ),
    growthRepository.listGoals(ownerId),
  ]);
  const logsByHabit = new Map<string, typeof logs>();
  for (const log of logs) {
    logsByHabit.set(log.habitId, [
      ...(logsByHabit.get(log.habitId) ?? []),
      log,
    ]);
  }

  const habitStats = habits.map((habit) => {
    const habitLogs = logsByHabit.get(habit.id) ?? [];
    const weeklyValue = habitLogs.reduce(
      (sum, log) => sum + Number(log.value.toFixed(2)),
      0,
    );
    const progressCount = habitLogs.length;
    const progressValue = habit.unit === "sesiones" ? progressCount : weeklyValue;
    const weeklyTarget =
      habit.targetCount === null
        ? null
        : habit.period === "DAILY"
          ? habit.targetCount * 7
          : habit.targetCount;

    return {
      ...habit,
      progressCount,
      progressValue,
      weeklyValue,
      weeklyTarget,
      progressPercent: weeklyTarget
        ? Math.min(100, Math.round((progressValue / weeklyTarget) * 100))
        : null,
      latestDate: habitLogs[0]?.date ?? null,
    };
  });
  const activeHabits = habitStats.filter((habit) => habit.active);
  const targeted = activeHabits.filter((habit) => habit.weeklyTarget !== null);
  const goalsActive = goals.filter((goal) => goal.status === "ACTIVE");

  return {
    today,
    week,
    habits: habitStats,
    goals,
    metrics: {
      activeHabits: activeHabits.length,
      weeklyLogs: logs.length,
      habitsOnTarget: targeted.filter(
        (habit) => habit.progressValue >= (habit.weeklyTarget ?? Infinity),
      ).length,
      activeGoals: goalsActive.length,
    },
  };
}
