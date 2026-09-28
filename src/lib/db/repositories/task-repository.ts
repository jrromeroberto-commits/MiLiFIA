import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const taskRepository = {
  create(userId: string, data: Omit<Prisma.TaskUncheckedCreateInput, "userId">) {
    return db.task.create({ data: { ...data, userId } });
  },

  findById(userId: string, id: string) {
    return db.task.findFirst({ where: { id, userId } });
  },

  list(userId: string) {
    return db.task.findMany({
      where: { userId },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
  },

  async update(
    userId: string,
    id: string,
    data: Prisma.TaskUncheckedUpdateManyInput,
  ) {
    const result = await db.task.updateMany({ where: { id, userId }, data });
    return result.count === 0 ? null : db.task.findUnique({ where: { id } });
  },

  async delete(userId: string, id: string) {
    const result = await db.task.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};
