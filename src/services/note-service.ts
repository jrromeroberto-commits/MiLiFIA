import "server-only";
import { noteRepository } from "@/lib/db/repositories/note-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createNoteSchema,
  type CreateNoteInput,
  updateNoteSchema,
  type UpdateNoteInput,
} from "@/lib/validation/note";
import { EntityNotFoundError } from "@/services/errors";
import { assertProjectOwnership } from "@/services/project-ownership";

export async function createNote(userId: string, input: CreateNoteInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createNoteSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);
  return noteRepository.create(ownerId, data);
}

export function listNotes(userId: string) {
  return noteRepository.list(entityIdSchema.parse(userId));
}

export async function getNote(userId: string, noteId: string) {
  const note = await noteRepository.findById(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(noteId),
  );

  if (!note) throw new EntityNotFoundError("La nota");
  return note;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
) {
  const ownerId = entityIdSchema.parse(userId);
  const id = entityIdSchema.parse(noteId);
  const data = updateNoteSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  const note = await noteRepository.update(ownerId, id, data);
  if (!note) throw new EntityNotFoundError("La nota");
  return note;
}

export async function deleteNote(userId: string, noteId: string) {
  const deleted = await noteRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(noteId),
  );

  if (!deleted) throw new EntityNotFoundError("La nota");
}
