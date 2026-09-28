import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import {
  createIdea,
  deleteIdea,
  getIdea,
  listIdeas,
  updateIdea,
} from "@/services/idea-service";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "@/services/note-service";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/services/project-service";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "@/services/task-service";
import { EntityNotFoundError } from "@/services/errors";

const testRun = randomUUID().slice(0, 8);
const createdIds: {
  project?: string;
  task?: string;
  idea?: string;
  note?: string;
  outsider?: string;
} = {};

async function main() {
  const owner = await db.user.findUnique({
    where: { email: "owner@lifeos.local" },
  });
  assert(owner, "El usuario semilla debe existir.");

  const outsider = await db.user.create({
    data: {
      name: "Usuario de verificación",
      email: `verify-${testRun}@lifeos.local`,
    },
  });
  createdIds.outsider = outsider.id;

  const project = await createProject(owner.id, {
    name: `Proyecto de verificación ${testRun}`,
    description: "Se elimina automáticamente al terminar.",
  });
  createdIds.project = project.id;
  assert((await listProjects(owner.id)).some(({ id }) => id === project.id));
  assert.equal((await getProject(owner.id, project.id)).name, project.name);
  assert.equal((await updateProject(owner.id, project.id, { status: "PAUSED" })).status, "PAUSED");
  await assert.rejects(
    () => getProject(outsider.id, project.id),
    EntityNotFoundError,
    "Otro usuario no debe leer el proyecto.",
  );

  const task = await createTask(owner.id, {
    projectId: project.id,
    title: `Tarea ${testRun}`,
    priority: "HIGH",
    dueDate: "2026-09-29",
  });
  createdIds.task = task.id;
  assert((await listTasks(owner.id)).some(({ id }) => id === task.id));
  assert.equal((await getTask(owner.id, task.id)).title, task.title);
  const completedTask = await updateTask(owner.id, task.id, { status: "COMPLETED" });
  assert.equal(completedTask.status, "COMPLETED");
  assert(completedTask.completedAt);

  const idea = await createIdea(owner.id, {
    projectId: project.id,
    title: `Idea ${testRun}`,
    description: "Validar el flujo completo.",
  });
  createdIds.idea = idea.id;
  assert((await listIdeas(owner.id)).some(({ id }) => id === idea.id));
  assert.equal((await getIdea(owner.id, idea.id)).title, idea.title);
  assert.equal((await updateIdea(owner.id, idea.id, { status: "EXPLORING" })).status, "EXPLORING");

  const note = await createNote(owner.id, {
    projectId: project.id,
    title: `Nota ${testRun}`,
    content: "Contenido original.",
  });
  createdIds.note = note.id;
  assert((await listNotes(owner.id)).some(({ id }) => id === note.id));
  assert.equal((await getNote(owner.id, note.id)).title, note.title);
  assert.equal(
    (await updateNote(owner.id, note.id, { content: "Contenido actualizado." })).content,
    "Contenido actualizado.",
  );

  await deleteTask(owner.id, task.id);
  createdIds.task = undefined;
  await deleteIdea(owner.id, idea.id);
  createdIds.idea = undefined;
  await deleteNote(owner.id, note.id);
  createdIds.note = undefined;
  await deleteProject(owner.id, project.id);
  createdIds.project = undefined;

  console.log("CRUD verificado: proyectos, tareas, ideas y notas.");
  console.log("Aislamiento por userId verificado.");
}

async function cleanup() {
  if (createdIds.task) await db.task.deleteMany({ where: { id: createdIds.task } });
  if (createdIds.idea) await db.idea.deleteMany({ where: { id: createdIds.idea } });
  if (createdIds.note) await db.note.deleteMany({ where: { id: createdIds.note } });
  if (createdIds.project) {
    await db.project.deleteMany({ where: { id: createdIds.project } });
  }
  if (createdIds.outsider) {
    await db.user.deleteMany({ where: { id: createdIds.outsider } });
  }
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
