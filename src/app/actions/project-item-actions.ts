"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { actionErrorState } from "@/lib/forms/action-error";
import type { ActionState } from "@/lib/forms/action-state";
import type { CreateIdeaInput } from "@/lib/validation/idea";
import type { CreateTaskInput } from "@/lib/validation/task";
import { createIdea } from "@/services/idea-service";
import { createNote } from "@/services/note-service";
import { createTask, updateTask } from "@/services/task-service";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function refreshProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function createTaskAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = text(formData, "projectId");

  try {
    const user = await requireCurrentUser();
    await createTask(user.id, {
      projectId,
      title: text(formData, "title"),
      description: text(formData, "description").trim() || null,
      priority: text(formData, "priority") as CreateTaskInput["priority"],
      dueDate: text(formData, "dueDate") || null,
    });
  } catch (error) {
    return actionErrorState(error, "No pudimos crear la tarea.");
  }

  refreshProject(projectId);
  return { status: "success", message: "Tarea agregada." };
}

export async function createIdeaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = text(formData, "projectId");

  try {
    const user = await requireCurrentUser();
    await createIdea(user.id, {
      projectId,
      title: text(formData, "title"),
      description: text(formData, "description").trim() || null,
      status: text(formData, "status") as CreateIdeaInput["status"],
    });
  } catch (error) {
    return actionErrorState(error, "No pudimos guardar la idea.");
  }

  refreshProject(projectId);
  return { status: "success", message: "Idea guardada." };
}

export async function createNoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = text(formData, "projectId");

  try {
    const user = await requireCurrentUser();
    await createNote(user.id, {
      projectId,
      title: text(formData, "title").trim() || null,
      content: text(formData, "content"),
    });
  } catch (error) {
    return actionErrorState(error, "No pudimos guardar la nota.");
  }

  refreshProject(projectId);
  return { status: "success", message: "Nota guardada." };
}

export async function completeTaskAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const taskId = text(formData, "taskId");
  const user = await requireCurrentUser();
  await updateTask(user.id, taskId, { status: "COMPLETED" });
  refreshProject(projectId);
}
