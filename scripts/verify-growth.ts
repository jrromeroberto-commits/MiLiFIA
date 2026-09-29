import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { processChatMessage } from "@/services/chat-service";
import { getGrowthDashboard } from "@/services/growth-service";

const suffix = randomUUID().slice(0, 8);
const habitName = `Estudiar inglés ${suffix}`;
const walkName = `Caminar ${suffix}`;
const goalTitle = `Terminar LifeOS ${suffix}`;

async function runIntent(userId: string, intent: LifeOSIntent) {
  return processChatMessage(userId, "Mensaje válido de crecimiento", {
    interpret: async () => intent,
  });
}

async function main() {
  const user = await requireCurrentUser();
  const habitResult = await runIntent(user.id, {
    intent: "create_habit",
    habitName,
    description: null,
    habitFrequency: "WEEKLY",
    habitTargetCount: 4,
    habitUnit: "SESSIONS",
    clarificationQuestion: null,
  });
  assert.equal(habitResult.outcome, "created");

  const duplicate = await runIntent(user.id, {
    intent: "create_habit",
    habitName: habitName.toLocaleLowerCase("es"),
    description: null,
    habitFrequency: "WEEKLY",
    habitTargetCount: 4,
    habitUnit: "SESSIONS",
    clarificationQuestion: null,
  });
  assert.equal(duplicate.mutated, false);

  for (const date of ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"]) {
    const log = await runIntent(user.id, {
      intent: "log_habit",
      habitName,
      habitValue: 1,
      habitUnit: "SESSIONS",
      habitDate: date,
      clarificationQuestion: null,
    });
    assert.equal(log.outcome, "created");
  }

  const walk = await runIntent(user.id, {
    intent: "log_habit",
    habitName: walkName,
    habitValue: 40,
    habitUnit: "MINUTES",
    habitDate: "2026-09-29",
    clarificationQuestion: null,
  });
  assert.equal(walk.outcome, "created");
  assert.match(walk.reply, /sin inventar un objetivo/i);

  const mismatch = await runIntent(user.id, {
    intent: "log_habit",
    habitName,
    habitValue: 30,
    habitUnit: "MINUTES",
    habitDate: "2026-09-29",
    clarificationQuestion: null,
  });
  assert.equal(mismatch.outcome, "clarification");
  assert.equal(mismatch.mutated, false);

  const goal = await runIntent(user.id, {
    intent: "create_goal",
    goalTitle,
    description: null,
    goalTargetDate: "2026-09-30",
    clarificationQuestion: null,
  });
  assert.equal(goal.outcome, "created");

  const dashboard = await getGrowthDashboard(
    user.id,
    new Date("2026-09-29T15:00:00.000Z"),
  );
  const studyStats = dashboard.habits.find((habit) => habit.name === habitName);
  const walkStats = dashboard.habits.find((habit) => habit.name === walkName);
  assert(studyStats);
  assert(walkStats);
  assert.equal(studyStats.progressValue, 4);
  assert.equal(studyStats.progressPercent, 100);
  assert.equal(walkStats.weeklyValue, 40);
  assert.equal(walkStats.weeklyTarget, null);
  assert(dashboard.metrics.weeklyLogs >= 5);
  assert(dashboard.metrics.habitsOnTarget >= 1);
  assert(
    dashboard.goals.some(
      (item) =>
        item.title === goalTitle &&
        item.targetDate?.toISOString().slice(0, 10) === "2026-09-30",
    ),
  );

  console.log(
    "Crecimiento verificado: hábitos, registros, metas, unidades y estadísticas semanales reales.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  await db.goal.deleteMany({ where: { userId: user.id, title: goalTitle } });
  await db.habit.deleteMany({
    where: { userId: user.id, name: { in: [habitName, walkName] } },
  });
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
