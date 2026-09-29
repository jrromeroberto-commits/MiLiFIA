import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AiServiceError } from "@/lib/ai/errors";
import {
  generateReviewNarrative,
  parseReviewNarrative,
} from "@/lib/ai/review-narrative-service";
import type {
  StructuredOutputProvider,
  StructuredOutputRequest,
} from "@/lib/ai/provider";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { calendarDateUtc, localDateKey, offsetDateKey } from "@/lib/time/calendar";
import { createIdea, deleteIdea } from "@/services/idea-service";
import { createNote, deleteNote } from "@/services/note-service";
import { createProject, deleteProject } from "@/services/project-service";
import { getReviewReport } from "@/services/review-service";
import { createTask, deleteTask } from "@/services/task-service";

const suffix = randomUUID().slice(0, 8);
const names = {
  project: `Revisión activa ${suffix}`,
  inactiveProject: `Revisión inactiva ${suffix}`,
  completedTask: `Completada revisión ${suffix}`,
  overdueTask: `Vencida importante ${suffix}`,
  idea: `Idea de revisión ${suffix}`,
  note: `Nota de avance ${suffix}`,
};
const created: {
  project?: string;
  inactiveProject?: string;
  completedTask?: string;
  overdueTask?: string;
  idea?: string;
  note?: string;
} = {};

class FakeNarrativeProvider implements StructuredOutputProvider {
  lastRequest: StructuredOutputRequest | null = null;

  async generateStructuredOutput(request: StructuredOutputRequest) {
    this.lastRequest = request;
    return JSON.stringify({
      summary: "El período muestra progreso y un pendiente que requiere atención.",
      wins: ["Se registraron tareas completadas."],
      attention: ["Hay tareas vencidas."],
      nextStep: "Revisa primero los pendientes importantes.",
    });
  }
}

function section(report: Awaited<ReturnType<typeof getReviewReport>>, id: string) {
  const found = report.sections.find((item) => item.id === id);
  assert(found, `No se encontró la sección ${id}.`);
  return found;
}

async function main() {
  const user = await requireCurrentUser();
  const now = new Date();
  const today = localDateKey(now);

  const project = await createProject(user.id, { name: names.project });
  created.project = project.id;

  const completedTask = await createTask(user.id, {
    projectId: project.id,
    title: names.completedTask,
    status: "COMPLETED",
  });
  created.completedTask = completedTask.id;

  const overdueTask = await createTask(user.id, {
    projectId: project.id,
    title: names.overdueTask,
    priority: "HIGH",
    dueDate: calendarDateUtc(offsetDateKey(today, -1)),
  });
  created.overdueTask = overdueTask.id;

  const idea = await createIdea(user.id, {
    projectId: project.id,
    title: names.idea,
  });
  created.idea = idea.id;

  const note = await createNote(user.id, {
    projectId: project.id,
    title: names.note,
    content: "Contenido temporal para registrar actividad.",
  });
  created.note = note.id;

  const oldDate = new Date("2020-01-01T12:00:00.000Z");
  const inactiveProject = await db.project.create({
    data: {
      userId: user.id,
      name: names.inactiveProject,
      createdAt: oldDate,
      updatedAt: oldDate,
    },
  });
  created.inactiveProject = inactiveProject.id;

  const daily = await getReviewReport(user.id, "daily", now);
  assert(section(daily, "completed").items.some((item) => item.title === names.completedTask));
  assert(section(daily, "pending").items.some((item) => item.title === names.overdueTask));
  assert(section(daily, "worked-projects").items.some((item) => item.title === names.project));
  assert(section(daily, "new-ideas").items.some((item) => item.title === names.idea));
  assert(section(daily, "overdue").items.some((item) => item.title === names.overdueTask));

  const weekly = await getReviewReport(user.id, "weekly", now);
  assert(section(weekly, "completed").items.some((item) => item.title === names.completedTask));
  assert(section(weekly, "active-projects").items.some((item) => item.title === names.project));
  assert(section(weekly, "inactive-projects").items.some((item) => item.title === names.inactiveProject));
  assert(section(weekly, "new-ideas").items.some((item) => item.title === names.idea));
  assert(section(weekly, "important-pending").items.some((item) => item.title === names.overdueTask));

  const provider = new FakeNarrativeProvider();
  const narrative = await generateReviewNarrative(daily, { provider });
  assert.match(narrative.summary, /progreso/);
  assert(provider.lastRequest);
  assert(!provider.lastRequest.input.includes(names.completedTask));
  assert(!provider.lastRequest.input.includes(names.project));
  assert.match(provider.lastRequest.input, /Completadas/);

  assert.throws(
    () => parseReviewNarrative('{"summary":"incompleta"}'),
    (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
  );

  console.log(
    "Revisiones verificadas: 5 secciones diarias, 5 semanales y narrativa privada con métricas agregadas.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  if (created.completedTask) await deleteTask(user.id, created.completedTask);
  if (created.overdueTask) await deleteTask(user.id, created.overdueTask);
  if (created.idea) await deleteIdea(user.id, created.idea);
  if (created.note) await deleteNote(user.id, created.note);
  if (created.project) await deleteProject(user.id, created.project);
  if (created.inactiveProject) await deleteProject(user.id, created.inactiveProject);
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

