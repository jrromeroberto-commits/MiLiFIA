"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { ProjectFileError } from "@/lib/files/extractor";
import type { ActionState } from "@/lib/forms/action-state";
import {
  deleteProjectFile,
  uploadProjectFile,
} from "@/services/project-file-service";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function browserMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").at(-1)?.toLocaleLowerCase("en");
  return {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  }[extension ?? ""] ?? "application/octet-stream";
}

function refreshProject(projectId: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function uploadProjectFileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = text(formData, "projectId");

  try {
    const selected = formData.get("file");
    if (!(selected instanceof File) || selected.size === 0) {
      return { status: "error", message: "Selecciona un archivo para continuar." };
    }
    const user = await requireCurrentUser();
    const result = await uploadProjectFile(user.id, {
      projectId,
      originalName: selected.name,
      mimeType: browserMimeType(selected),
      data: new Uint8Array(await selected.arrayBuffer()),
    });
    refreshProject(projectId);
    return result.duplicate
      ? { status: "success", message: "Ese mismo archivo ya estaba guardado en el proyecto." }
      : { status: "success", message: "Archivo guardado e indexado de forma local." };
  } catch (error) {
    if (error instanceof ProjectFileError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof ZodError) {
      return { status: "error", message: error.issues[0]?.message ?? "Revisa el archivo seleccionado." };
    }
    console.error(error);
    return { status: "error", message: "No pudimos guardar el archivo." };
  }
}

export async function deleteProjectFileAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const fileId = text(formData, "fileId");
  const user = await requireCurrentUser();
  await deleteProjectFile(user.id, fileId);
  refreshProject(projectId);
}
