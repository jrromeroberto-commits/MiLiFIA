import "server-only";

import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { formatCalendarDate } from "@/lib/presentation/date";
import { calendarDateUtc } from "@/lib/time/calendar";
import type { ChatToolResult } from "@/services/chat-types";
import {
  createGoal,
  createHabit,
  GrowthValidationError,
  logHabit,
  resolveHabit,
} from "@/services/growth-service";

type GrowthIntent = Extract<
  LifeOSIntent,
  { intent: "create_habit" | "log_habit" | "create_goal" }
>;

const unitLabels = {
  SESSIONS: "sesiones",
  MINUTES: "minutos",
  HOURS: "horas",
  KILOMETERS: "kilómetros",
  PAGES: "páginas",
} as const;

function result(
  intent: GrowthIntent["intent"],
  values: Omit<ChatToolResult, "intent">,
): ChatToolResult {
  return { intent, ...values };
}

async function executeCreateHabit(
  userId: string,
  intent: Extract<GrowthIntent, { intent: "create_habit" }>,
) {
  const saved = await createHabit(userId, {
    name: intent.habitName,
    description: intent.description,
    period: intent.habitFrequency,
    targetCount: intent.habitTargetCount,
    unit: unitLabels[intent.habitUnit],
  });
  const period = intent.habitFrequency === "DAILY" ? "día" : "semana";
  return result(intent.intent, {
    outcome: saved.created ? "created" : "answer",
    reply: saved.created
      ? `Creé el hábito “${saved.habit.name}” con un objetivo de ${intent.habitTargetCount} ${unitLabels[intent.habitUnit]} por ${period}.`
      : `El hábito “${saved.habit.name}” ya existe; no creé un duplicado.`,
    items: [
      {
        label: saved.habit.name,
        detail: `${saved.habit.targetCount ?? "Sin objetivo"} ${saved.habit.unit} por ${saved.habit.period === "DAILY" ? "día" : "semana"}`,
        href: "/growth",
      },
    ],
    mutated: saved.created,
  });
}

async function executeLogHabit(
  userId: string,
  intent: Extract<GrowthIntent, { intent: "log_habit" }>,
) {
  try {
    let habit = await resolveHabit(userId, intent.habitName);
    let created = false;
    const unit = unitLabels[intent.habitUnit];
    if (!habit) {
      const saved = await createHabit(userId, {
        name: intent.habitName,
        description: null,
        period: "WEEKLY",
        targetCount: null,
        unit,
      });
      habit = saved.habit;
      created = saved.created;
    }
    if (habit.unit !== unit) {
      return result(intent.intent, {
        outcome: "clarification",
        reply: `El hábito “${habit.name}” se mide en ${habit.unit}, pero mencionaste ${unit}. ¿Qué valor deseas registrar en ${habit.unit}?`,
        items: [],
        mutated: false,
      });
    }

    const saved = await logHabit(userId, {
      habitId: habit.id,
      value: intent.habitValue,
      date: calendarDateUtc(intent.habitDate),
      note: null,
    });
    return result(intent.intent, {
      outcome: "created",
      reply: `Registré ${Number(saved.log.value.toFixed(2))} ${habit.unit} en “${habit.name}”${created ? " y creé el hábito sin inventar un objetivo" : ""}.`,
      items: [
        {
          label: habit.name,
          detail: `${formatCalendarDate(saved.log.date)} · ${Number(saved.log.value.toFixed(2))} ${habit.unit}`,
          href: "/growth",
        },
      ],
      mutated: true,
    });
  } catch (error) {
    if (error instanceof GrowthValidationError) {
      return result(intent.intent, {
        outcome: "clarification",
        reply: error.message,
        items: [],
        mutated: false,
      });
    }
    throw error;
  }
}

async function executeCreateGoal(
  userId: string,
  intent: Extract<GrowthIntent, { intent: "create_goal" }>,
) {
  const goal = await createGoal(userId, {
    title: intent.goalTitle,
    description: intent.description,
    targetDate: intent.goalTargetDate
      ? calendarDateUtc(intent.goalTargetDate)
      : null,
  });
  return result(intent.intent, {
    outcome: "created",
    reply: `Creé la meta “${goal.title}”${goal.targetDate ? ` para ${formatCalendarDate(goal.targetDate)}` : " sin fecha límite"}.`,
    items: [
      {
        label: goal.title,
        detail: goal.targetDate
          ? `Fecha objetivo: ${formatCalendarDate(goal.targetDate)}`
          : "Sin fecha objetivo",
        href: "/growth",
      },
    ],
    mutated: true,
  });
}

export function executeGrowthIntent(userId: string, intent: GrowthIntent) {
  switch (intent.intent) {
    case "create_habit":
      return executeCreateHabit(userId, intent);
    case "log_habit":
      return executeLogHabit(userId, intent);
    case "create_goal":
      return executeCreateGoal(userId, intent);
  }
}
