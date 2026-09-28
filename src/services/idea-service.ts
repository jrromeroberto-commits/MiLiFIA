import "server-only";
import { ideaRepository } from "@/lib/db/repositories/idea-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createIdeaSchema,
  type CreateIdeaInput,
  updateIdeaSchema,
  type UpdateIdeaInput,
} from "@/lib/validation/idea";
import { EntityNotFoundError } from "@/services/errors";
import { assertProjectOwnership } from "@/services/project-ownership";

export async function createIdea(userId: string, input: CreateIdeaInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createIdeaSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);
  return ideaRepository.create(ownerId, data);
}

export function listIdeas(userId: string) {
  return ideaRepository.list(entityIdSchema.parse(userId));
}

export async function getIdea(userId: string, ideaId: string) {
  const idea = await ideaRepository.findById(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(ideaId),
  );

  if (!idea) throw new EntityNotFoundError("La idea");
  return idea;
}

export async function updateIdea(
  userId: string,
  ideaId: string,
  input: UpdateIdeaInput,
) {
  const ownerId = entityIdSchema.parse(userId);
  const id = entityIdSchema.parse(ideaId);
  const data = updateIdeaSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  const idea = await ideaRepository.update(ownerId, id, data);
  if (!idea) throw new EntityNotFoundError("La idea");
  return idea;
}

export async function deleteIdea(userId: string, ideaId: string) {
  const deleted = await ideaRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(ideaId),
  );

  if (!deleted) throw new EntityNotFoundError("La idea");
}
