import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { deleteIdea, listIdeas } from "@/services/idea-service";
import { deleteNote, listNotes } from "@/services/note-service";
import {
  deleteProject,
  listProjects,
} from "@/services/project-service";
import { processChatMessage } from "@/services/chat-service";
import {
  deleteTask,
  getTask,
  listTasks,
} from "@/services/task-service";

const suffix = randomUUID().slice(0, 8);
const names = {
  project: `Chat verificación ${suffix}`,
  task: `Tarea chat ${suffix}`,
  idea: `Idea chat ${suffix}`,
  note: `Nota chat ${suffix}`,
};
const created: { project?: string; task?: string; idea?: string; note?: string } = {};

async function runIntent(userId: string, intent: LifeOSIntent) {
  return processChatMessage(userId, "Mensaje válido de prueba", {
    interpret: async () => intent,
  });
}

async function main() {
  const user = await requireCurrentUser();

  const projectResult = await runIntent(user.id, {
    intent: "create_project",
    name: names.project,
    description: "Proyecto temporal del verificador de chat.",
    clarificationQuestion: null,
  });
  assert.equal(projectResult.outcome, "created");
  const project = (await listProjects(user.id)).find(
    (item) => item.name === names.project,
  );
  assert(project);
  created.project = project.id;

  const duplicateProjectResult = await runIntent(user.id, {
    intent: "create_project",
    name: names.project.toLocaleLowerCase("es"),
    description: null,
    clarificationQuestion: null,
  });
  assert.equal(duplicateProjectResult.mutated, false);
  assert.equal(
    (await listProjects(user.id)).filter(
      (item) => item.name.toLocaleLowerCase("es") === names.project.toLocaleLowerCase("es"),
    ).length,
    1,
  );

  const missingProjectTaskTitle = `Tarea bloqueada ${suffix}`;
  const missingProjectResult = await runIntent(user.id, {
    intent: "create_task",
    title: missingProjectTaskTitle,
    description: null,
    projectName: `Proyecto inexistente ${suffix}`,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  });
  assert.equal(missingProjectResult.outcome, "clarification");
  assert(
    !(await listTasks(user.id)).some(
      (item) => item.title === missingProjectTaskTitle,
    ),
    "Una referencia ambigua no debe crear la tarea.",
  );

  const taskResult = await runIntent(user.id, {
    intent: "create_task",
    title: names.task,
    description: null,
    projectName: names.project,
    dueDate: "2026-09-29",
    priority: "HIGH",
    clarificationQuestion: null,
  });
  assert.equal(taskResult.outcome, "created");
  const task = (await listTasks(user.id)).find((item) => item.title === names.task);
  assert(task);
  assert.equal(task.projectId, project.id);
  created.task = task.id;

  const ideaResult = await runIntent(user.id, {
    intent: "create_idea",
    title: names.idea,
    description: "Idea temporal.",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(ideaResult.outcome, "created");
  const idea = (await listIdeas(user.id)).find((item) => item.title === names.idea);
  assert(idea);
  created.idea = idea.id;

  const noteResult = await runIntent(user.id, {
    intent: "create_note",
    title: names.note,
    content: "Contenido temporal del chat.",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(noteResult.outcome, "created");
  const note = (await listNotes(user.id)).find((item) => item.title === names.note);
  assert(note);
  created.note = note.id;

  const taskListResult = await runIntent(user.id, {
    intent: "list_tasks",
    taskStatus: "PENDING",
    timeframe: "ALL",
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert(taskListResult.items.some((item) => item.label === names.task));

  const projectListResult = await runIntent(user.id, {
    intent: "list_projects",
    projectStatus: "ACTIVE",
    clarificationQuestion: null,
  });
  assert(projectListResult.items.some((item) => item.label === names.project));

  const completeResult = await runIntent(user.id, {
    intent: "complete_task",
    title: names.task,
    projectName: names.project,
    clarificationQuestion: null,
  });
  assert.equal(completeResult.outcome, "completed");
  assert.equal((await getTask(user.id, task.id)).status, "COMPLETED");

  const unknownResult = await runIntent(user.id, {
    intent: "unknown",
    clarificationQuestion: "¿Puedes decirme qué deseas organizar?",
  });
  assert.equal(unknownResult.outcome, "clarification");
  assert.equal(unknownResult.mutated, false);

  console.log(
    "Chat verificado: 8 intents, herramientas internas y escrituras reales en PostgreSQL.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  if (created.task) await deleteTask(user.id, created.task);
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
