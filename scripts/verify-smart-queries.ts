import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { localDateKey, offsetDateKey } from "@/lib/time/calendar";
import { createIdea, deleteIdea } from "@/services/idea-service";
import { createNote, deleteNote } from "@/services/note-service";
import { createProject, deleteProject } from "@/services/project-service";
import { processChatMessage } from "@/services/chat-service";
import { createTask, deleteTask } from "@/services/task-service";

const suffix = randomUUID().slice(0, 8);
const names = {
  project: `Consulta inteligente ${suffix}`,
  todayTask: `Tarea de hoy ${suffix}`,
  overdueTask: `Tarea atrasada ${suffix}`,
  idea: `Idea semanal ${suffix}`,
  note: `Avance reciente ${suffix}`,
};
const created: {
  project?: string;
  todayTask?: string;
  overdueTask?: string;
  idea?: string;
  note?: string;
} = {};

function utcCalendarDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

async function ask(userId: string, intent: LifeOSIntent) {
  return processChatMessage(userId, "Consulta inteligente de prueba", {
    interpret: async () => intent,
  });
}

async function trackedSnapshot(userId: string) {
  const [project, tasks, idea, note] = await Promise.all([
    db.project.findFirst({
      where: { userId, name: names.project },
      select: { id: true, updatedAt: true },
    }),
    db.task.findMany({
      where: { userId, title: { in: [names.todayTask, names.overdueTask] } },
      select: { id: true, updatedAt: true },
      orderBy: { title: "asc" },
    }),
    db.idea.findFirst({
      where: { userId, title: names.idea },
      select: { id: true, updatedAt: true },
    }),
    db.note.findFirst({
      where: { userId, title: names.note },
      select: { id: true, updatedAt: true },
    }),
  ]);

  return JSON.stringify({ project, tasks, idea, note });
}

async function main() {
  const user = await requireCurrentUser();
  const today = localDateKey(new Date());
  const yesterday = offsetDateKey(today, -1);

  const project = await createProject(user.id, {
    name: names.project,
    description: "Proyecto temporal para comprobar consultas.",
  });
  created.project = project.id;

  const todayTask = await createTask(user.id, {
    projectId: project.id,
    title: names.todayTask,
    dueDate: utcCalendarDate(today),
  });
  created.todayTask = todayTask.id;

  const overdueTask = await createTask(user.id, {
    projectId: project.id,
    title: names.overdueTask,
    dueDate: utcCalendarDate(yesterday),
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
    content: "Registro temporal de actividad.",
  });
  created.note = note.id;

  const snapshotBefore = await trackedSnapshot(user.id);

  const todayResult = await ask(user.id, {
    intent: "list_tasks",
    taskStatus: "PENDING",
    timeframe: "TODAY",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert(todayResult.items.some((item) => item.label === names.todayTask));
  assert(!todayResult.items.some((item) => item.label === names.overdueTask));

  const overdueResult = await ask(user.id, {
    intent: "list_tasks",
    taskStatus: "PENDING",
    timeframe: "OVERDUE",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert(overdueResult.items.some((item) => item.label === names.overdueTask));
  assert(!overdueResult.items.some((item) => item.label === names.todayTask));

  const projectsResult = await ask(user.id, {
    intent: "list_projects",
    projectStatus: "ACTIVE",
    clarificationQuestion: null,
  });
  assert(projectsResult.items.some((item) => item.label === names.project));

  const ideasResult = await ask(user.id, {
    intent: "list_ideas",
    timeframe: "THIS_WEEK",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert(ideasResult.items.some((item) => item.label === names.idea));

  const activityResult = await ask(user.id, {
    intent: "get_project_activity",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(activityResult.outcome, "answer");
  assert.match(activityResult.reply, new RegExp(names.project));
  assert.equal(activityResult.items[0]?.href, `/projects/${project.id}`);

  const missingProjectResult = await ask(user.id, {
    intent: "get_project_activity",
    projectName: `No existe ${suffix}`,
    clarificationQuestion: null,
  });
  assert.equal(missingProjectResult.outcome, "clarification");

  assert.equal(await trackedSnapshot(user.id), snapshotBefore);
  for (const result of [
    todayResult,
    overdueResult,
    projectsResult,
    ideasResult,
    activityResult,
  ]) {
    assert.equal(result.mutated, false);
  }

  console.log(
    "Consultas inteligentes verificadas: hoy, atrasadas, proyectos activos, ideas semanales y última actividad.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  if (created.todayTask) await deleteTask(user.id, created.todayTask);
  if (created.overdueTask) await deleteTask(user.id, created.overdueTask);
  if (created.idea) await deleteIdea(user.id, created.idea);
  if (created.note) await deleteNote(user.id, created.note);
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
