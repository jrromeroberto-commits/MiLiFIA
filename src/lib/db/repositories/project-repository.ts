import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const projectRepository = {
  create(userId: string, data: Omit<Prisma.ProjectUncheckedCreateInput, "userId">) {
    return db.project.create({ data: { ...data, userId } });
  },

  findById(userId: string, id: string) {
    return db.project.findFirst({ where: { id, userId } });
  },

  list(userId: string) {
    return db.project.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
  },

  async update(
    userId: string,
    id: string,
    data: Prisma.ProjectUncheckedUpdateManyInput,
  ) {
    const result = await db.project.updateMany({ where: { id, userId }, data });
    return result.count === 0 ? null : db.project.findUnique({ where: { id } });
  },

  async delete(userId: string, id: string) {
    const result = await db.project.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};
