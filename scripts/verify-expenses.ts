import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { localDateKey } from "@/lib/time/calendar";
import {
  deleteExpense,
  listExpenses,
  summarizeExpenses,
} from "@/services/expense-service";
import { createProject, deleteProject } from "@/services/project-service";
import { processChatMessage } from "@/services/chat-service";

const suffix = randomUUID().slice(0, 8);
const names = {
  project: `Gastos verificación ${suffix}`,
  lunch: `Almuerzo ${suffix}`,
  hosting: `Hosting ${suffix}`,
};
const created: { project?: string; expenses: string[] } = { expenses: [] };

async function runIntent(userId: string, intent: LifeOSIntent) {
  return processChatMessage(userId, "Mensaje válido de gasto", {
    interpret: async () => intent,
  });
}

async function main() {
  const user = await requireCurrentUser();
  const today = localDateKey(new Date());
  const project = await createProject(user.id, { name: names.project });
  created.project = project.id;

  const lunchResult = await runIntent(user.id, {
    intent: "create_expense",
    amount: 35,
    currency: "PEN",
    description: names.lunch,
    expenseCategory: "FOOD",
    expenseDate: today,
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(lunchResult.outcome, "created");

  const hostingResult = await runIntent(user.id, {
    intent: "create_expense",
    amount: 120,
    currency: "PEN",
    description: names.hosting,
    expenseCategory: "SOFTWARE",
    expenseDate: today,
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(hostingResult.outcome, "created");

  const expenses = (await listExpenses(user.id)).filter(
    (expense) => expense.projectId === project.id,
  );
  assert.equal(expenses.length, 2);
  created.expenses.push(...expenses.map((expense) => expense.id));
  assert.equal(expenses.find((expense) => expense.description === names.lunch)?.amount.toFixed(2), "35.00");

  const summary = await summarizeExpenses(user.id, {
    projectId: project.id,
    timeframe: "THIS_MONTH",
  });
  assert.equal(summary.total, "155.00");
  assert.equal(summary.count, 2);
  assert.equal(summary.categories[0].category, "SOFTWARE");
  assert.equal(summary.categories[0].total, "120.00");

  const totalResult = await runIntent(user.id, {
    intent: "summarize_expenses",
    expenseTimeframe: "THIS_MONTH",
    expenseAggregation: "TOTAL",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(totalResult.outcome, "answer");
  assert.match(totalResult.reply, /155[,.]00/);
  assert.equal(totalResult.mutated, false);

  const categoryResult = await runIntent(user.id, {
    intent: "summarize_expenses",
    expenseTimeframe: "THIS_MONTH",
    expenseAggregation: "BY_CATEGORY",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(categoryResult.items[0]?.label, "Software");
  assert.match(categoryResult.reply, /Software/);

  const blockedDescription = `No debe existir ${suffix}`;
  const blockedResult = await runIntent(user.id, {
    intent: "create_expense",
    amount: 10,
    currency: "PEN",
    description: blockedDescription,
    expenseCategory: "OTHER",
    expenseDate: today,
    projectName: `Proyecto inexistente ${suffix}`,
    clarificationQuestion: null,
  });
  assert.equal(blockedResult.outcome, "clarification");
  assert.equal(
    await db.expense.count({ where: { userId: user.id, description: blockedDescription } }),
    0,
  );

  console.log(
    "Gastos verificados: registro en PEN, relación con proyecto y totales exactos por categoría calculados en PostgreSQL.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  for (const expenseId of created.expenses) {
    await deleteExpense(user.id, expenseId);
  }
  if (created.project) await deleteProject(user.id, created.project);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await db.$disconnect();
  });

