import "server-only";
import { taskRepository } from "@/lib/db/repositories/task-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  createTaskSchema,
  type CreateTaskInput,
  updateTaskSchema,
  type UpdateTaskInput,
} from "@/lib/validation/task";
import { EntityNotFoundError } from "@/services/errors";
import { assertProjectOwnership } from "@/services/project-ownership";

export async function createTask(userId: string, input: CreateTaskInput) {
  const ownerId = entityIdSchema.parse(userId);
  const data = createTaskSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  const status = data.status ?? "TODO";
  return taskRepository.create(ownerId, {
    ...data,
    status,
    completedAt: status === "COMPLETED" ? new Date() : null,
  });
}

export function listTasks(userId: string) {
  return taskRepository.list(entityIdSchema.parse(userId));
}

export async function getTask(userId: string, taskId: string) {
  const task = await taskRepository.findById(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(taskId),
  );

  if (!task) throw new EntityNotFoundError("La tarea");
  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const ownerId = entityIdSchema.parse(userId);
  const id = entityIdSchema.parse(taskId);
  const data = updateTaskSchema.parse(input);

  if (data.projectId) await assertProjectOwnership(ownerId, data.projectId);

  const completedAt =
    data.status === undefined
      ? undefined
      : data.status === "COMPLETED"
        ? new Date()
        : null;

  const task = await taskRepository.update(ownerId, id, {
    ...data,
    completedAt,
  });

  if (!task) throw new EntityNotFoundError("La tarea");
  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  const deleted = await taskRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(taskId),
  );

  if (!deleted) throw new EntityNotFoundError("La tarea");
}
