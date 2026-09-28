import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createIdea, deleteIdea } from "@/services/idea-service";
import { createNote, deleteNote } from "@/services/note-service";
import { createProject, deleteProject } from "@/services/project-service";
import { createTask, deleteTask } from "@/services/task-service";

const baseUrl = process.env.LIFEOS_TEST_URL ?? "http://localhost:3000";
const suffix = randomUUID().slice(0, 8);
const created: { project?: string; task?: string; idea?: string; note?: string } = {};

async function assertRoute(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200, `${path} respondió ${response.status}`);
}

async function main() {
  const user = await requireCurrentUser();
  const project = await createProject(user.id, {
    name: `Verificación UI ${suffix}`,
    description: "Registro temporal para comprobar el renderizado.",
  });
  created.project = project.id;

  const task = await createTask(user.id, {
    projectId: project.id,
    title: `Tarea temporal ${suffix}`,
    dueDate: new Date(),
  });
  created.task = task.id;

  const idea = await createIdea(user.id, {
    projectId: project.id,
    title: `Idea temporal ${suffix}`,
  });
  created.idea = idea.id;

  const note = await createNote(user.id, {
    projectId: project.id,
    title: `Nota temporal ${suffix}`,
    content: "Contenido temporal.",
  });
  created.note = note.id;

  await assertRoute("/");
  await assertRoute("/projects");
  await assertRoute(`/projects/${project.id}`);
  await assertRoute("/inbox");
  console.log("Rutas con datos reales verificadas correctamente.");
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
  .finally(cleanup);
