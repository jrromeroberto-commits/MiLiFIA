import "server-only";
import { projectRepository } from "@/lib/db/repositories/project-repository";
import { EntityNotFoundError } from "@/services/errors";

export async function assertProjectOwnership(userId: string, projectId: string) {
  const project = await projectRepository.findById(userId, projectId);

  if (!project) {
    throw new EntityNotFoundError("El proyecto");
  }
}
