import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const ideaRepository = {
  create(userId: string, data: Omit<Prisma.IdeaUncheckedCreateInput, "userId">) {
    return db.idea.create({ data: { ...data, userId } });
  },

  findById(userId: string, id: string) {
    return db.idea.findFirst({ where: { id, userId } });
  },

  list(userId: string) {
    return db.idea.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async update(
    userId: string,
    id: string,
    data: Prisma.IdeaUncheckedUpdateManyInput,
  ) {
    const result = await db.idea.updateMany({ where: { id, userId }, data });
    return result.count === 0 ? null : db.idea.findUnique({ where: { id } });
  },

  async delete(userId: string, id: string) {
    const result = await db.idea.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};
