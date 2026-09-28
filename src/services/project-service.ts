import "server-only";
import { projectRepository } from "@/lib/db/repositories/project-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createProjectSchema,
  type CreateProjectInput,
  updateProjectSchema,
  type UpdateProjectInput,
} from "@/lib/validation/project";
import { EntityNotFoundError } from "@/services/errors";

export async function createProject(userId: string, input: CreateProjectInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createProjectSchema.parse(input);
  const status = data.status ?? "ACTIVE";

  return projectRepository.create(ownerId, {
    ...data,
    status,
    archivedAt: status === "ARCHIVED" ? new Date() : null,
  });
}

export function listProjects(userId: string) {
  return projectRepository.list(entityIdSchema.parse(userId));
}

export async function getProject(userId: string, projectId: string) {
  const project = await projectRepository.findById(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(projectId),
  );

  if (!project) throw new EntityNotFoundError("El proyecto");
  return project;
}

export async function getProjectDetail(userId: string, projectId: string) {
  const project = await projectRepository.findDetailById(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(projectId),
  );

  if (!project) throw new EntityNotFoundError("El proyecto");
  return project;
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
) {
  const ownerId = entityIdSchema.parse(userId);
  const id = entityIdSchema.parse(projectId);
  const data = updateProjectSchema.parse(input);

  if (data.status === "ARCHIVED" && data.archivedAt === undefined) {
    data.archivedAt = new Date();
  } else if (data.status && data.status !== "ARCHIVED") {
    data.archivedAt = null;
  }

  const project = await projectRepository.update(ownerId, id, data);
  if (!project) throw new EntityNotFoundError("El proyecto");
  return project;
}

export async function deleteProject(userId: string, projectId: string) {
  const deleted = await projectRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(projectId),
  );

  if (!deleted) throw new EntityNotFoundError("El proyecto");
}
