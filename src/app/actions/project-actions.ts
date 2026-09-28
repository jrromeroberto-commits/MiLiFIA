"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { actionErrorState } from "@/lib/forms/action-error";
import type { ActionState } from "@/lib/forms/action-state";
import type { UpdateProjectInput } from "@/lib/validation/project";
import { createProject, updateProject } from "@/services/project-service";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createProjectAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let projectId: string;

  try {
    const user = await requireCurrentUser();
    const project = await createProject(user.id, {
      name: text(formData, "name"),
      description: text(formData, "description").trim() || null,
    });
    projectId = project.id;
  } catch (error) {
    return actionErrorState(error, "No pudimos crear el proyecto.");
  }

  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function updateProjectAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = text(formData, "projectId");

  try {
    const user = await requireCurrentUser();
    await updateProject(user.id, projectId, {
      name: text(formData, "name"),
      description: text(formData, "description").trim() || null,
      status: text(formData, "status") as UpdateProjectInput["status"],
    });
  } catch (error) {
    return actionErrorState(error, "No pudimos actualizar el proyecto.");
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { status: "success", message: "Proyecto actualizado." };
}
