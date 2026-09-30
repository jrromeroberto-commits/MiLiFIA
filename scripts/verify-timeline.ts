import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { db } from "@/lib/db/client";
import { calendarDateUtc } from "@/lib/time/calendar";
import { getPersonalTimeline } from "@/services/timeline-service";

const suffix = randomUUID().slice(0, 8);
const emails = {
  owner: `timeline-${suffix}@lifeos.local`,
  other: `timeline-other-${suffix}@lifeos.local`,
};

async function main() {
  const [owner, other] = await Promise.all([
    db.user.create({ data: { name: "Timeline principal", email: emails.owner } }),
    db.user.create({ data: { name: "Timeline aislada", email: emails.other } }),
  ]);
  const project = await db.project.create({
    data: {
      userId: owner.id,
      name: `LifeOS Timeline ${suffix}`,
      createdAt: new Date("2026-09-30T15:30:00.000Z"),
    },
  });
  await Promise.all([
    db.task.create({
      data: {
        userId: owner.id,
        projectId: project.id,
        title: `Tarea timeline ${suffix}`,
        status: "COMPLETED",
        createdAt: new Date("2026-09-30T16:00:00.000Z"),
        completedAt: new Date("2026-09-30T18:15:00.000Z"),
      },
    }),
    db.idea.create({
      data: {
        userId: owner.id,
        projectId: project.id,
        title: `Idea timeline ${suffix}`,
        createdAt: new Date("2026-09-30T20:20:00.000Z"),
      },
    }),
    db.note.create({
      data: {
        userId: owner.id,
        projectId: project.id,
        title: `Nota semanal ${suffix}`,
        content: "Debe aparecer en la semana, no en el día seleccionado.",
        createdAt: new Date("2026-09-29T17:00:00.000Z"),
      },
    }),
    db.expense.create({
      data: {
        userId: owner.id,
        projectId: project.id,
        amount: "35.00",
        currency: "PEN",
        category: "OTHER",
        description: `Gasto timeline ${suffix}`,
        date: calendarDateUtc("2026-09-30"),
        createdAt: new Date("2026-10-01T04:40:00.000Z"),
      },
    }),
    db.project.create({
      data: {
        userId: other.id,
        name: `Proyecto ajeno ${suffix}`,
        createdAt: new Date("2026-09-30T19:00:00.000Z"),
      },
    }),
  ]);

  const daily = await getPersonalTimeline(owner.id, {
    period: "daily",
    date: "2026-09-30",
  });
  assert.equal(daily.groups.length, 1);
  assert.equal(daily.groups[0].dateKey, "2026-09-30");
  assert.equal(daily.metrics.totalEvents, 5);
  assert.equal(daily.metrics.completedTasks, 1);
  assert.equal(daily.metrics.activeProjects, 1);
  assert.equal(daily.metrics.capturedItems, 1);
  assert.deepEqual(
    daily.groups[0].events.map((event) => event.kind),
    [
      "EXPENSE_RECORDED",
      "IDEA_CREATED",
      "TASK_COMPLETED",
      "TASK_CREATED",
      "PROJECT_CREATED",
    ],
  );
  assert(!daily.groups[0].events.some((event) => event.detail.includes("Proyecto ajeno")));

  const weekly = await getPersonalTimeline(owner.id, {
    period: "weekly",
    date: "2026-09-30",
  });
  assert.equal(weekly.startDate, "2026-09-28");
  assert.equal(weekly.endDate, "2026-10-04");
  assert.equal(weekly.metrics.totalEvents, 6);
  assert.equal(weekly.groups.length, 2);
  assert(
    weekly.groups.some((group) =>
      group.events.some((event) => event.detail.includes(`Nota semanal ${suffix}`)),
    ),
  );

  await assert.rejects(
    () => getPersonalTimeline(owner.id, { period: "daily", date: "2026-02-31" }),
    ZodError,
  );

  console.log(
    "Timeline verificada: actividad diaria/semanal, orden horario, zona America/Lima y aislamiento por usuario.",
  );
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: { in: [emails.owner, emails.other] } } });
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
