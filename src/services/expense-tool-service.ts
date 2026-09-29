import "server-only";

import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { formatCalendarDate } from "@/lib/presentation/date";
import { calendarDateUtc } from "@/lib/time/calendar";
import type { ChatToolResult } from "@/services/chat-types";
import { createExpense, summarizeExpenses } from "@/services/expense-service";
import { resolveProject } from "@/services/project-resolution-service";

type ExpenseIntent = Extract<
  LifeOSIntent,
  { intent: "create_expense" | "summarize_expenses" }
>;

const categoryLabels = {
  FOOD: "Alimentación",
  TRANSPORT: "Transporte",
  HOUSING: "Vivienda",
  SERVICES: "Servicios",
  SOFTWARE: "Software",
  HEALTH: "Salud",
  EDUCATION: "Educación",
  ENTERTAINMENT: "Entretenimiento",
  SHOPPING: "Compras",
  OTHER: "Otros",
} as const;

const timeframeLabels = {
  TODAY: "hoy",
  THIS_WEEK: "esta semana",
  THIS_MONTH: "este mes",
  ALL: "en total",
} as const;

function money(value: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function result(
  intent: ExpenseIntent["intent"],
  values: Omit<ChatToolResult, "intent">,
): ChatToolResult {
  return { intent, ...values };
}

async function executeCreateExpense(
  userId: string,
  intent: Extract<ExpenseIntent, { intent: "create_expense" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const expense = await createExpense(userId, {
    projectId: project?.id ?? null,
    amount: intent.amount,
    currency: intent.currency,
    description: intent.description,
    category: intent.expenseCategory,
    date: calendarDateUtc(intent.expenseDate),
  });

  return result(intent.intent, {
    outcome: "created",
    reply: `Registré ${money(expense.amount.toFixed(2))} en “${expense.description}”${project ? ` para ${project.name}` : ""}.`,
    items: [
      {
        label: expense.description,
        detail: `${categoryLabels[expense.category]} · ${formatCalendarDate(expense.date)}`,
        href: project ? `/projects/${project.id}` : "/",
      },
    ],
    mutated: true,
  });
}

async function executeSummarizeExpenses(
  userId: string,
  intent: Extract<ExpenseIntent, { intent: "summarize_expenses" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const summary = await summarizeExpenses(userId, {
    projectId: project?.id ?? null,
    timeframe: intent.expenseTimeframe,
  });
  const period = timeframeLabels[intent.expenseTimeframe];
  const scope = project ? ` para ${project.name}` : "";

  if (summary.count === 0) {
    return result(intent.intent, {
      outcome: "answer",
      reply: `No encontré gastos ${period}${scope}.`,
      items: [],
      mutated: false,
    });
  }

  const topCategory = summary.categories[0];
  const reply =
    intent.expenseAggregation === "BY_CATEGORY" && topCategory
      ? `La categoría con mayor gasto ${period}${scope} fue ${categoryLabels[topCategory.category]} con ${money(topCategory.total)}. El total fue ${money(summary.total)}.`
      : `Gastaste ${money(summary.total)} ${period}${scope} en ${summary.count} ${summary.count === 1 ? "registro" : "registros"}.`;

  return result(intent.intent, {
    outcome: "answer",
    reply,
    items: summary.categories.slice(0, 8).map((category) => ({
      label: categoryLabels[category.category],
      detail: `${money(category.total)} · ${category.count} ${category.count === 1 ? "gasto" : "gastos"}`,
      href: project ? `/projects/${project.id}` : null,
    })),
    mutated: false,
  });
}

export function executeExpenseIntent(userId: string, intent: ExpenseIntent) {
  switch (intent.intent) {
    case "create_expense":
      return executeCreateExpense(userId, intent);
    case "summarize_expenses":
      return executeSummarizeExpenses(userId, intent);
  }
}

