import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const noteRepository = {
  create(userId: string, data: Omit<Prisma.NoteUncheckedCreateInput, "userId">) {
    return db.note.create({ data: { ...data, userId } });
  },

  findById(userId: string, id: string) {
    return db.note.findFirst({ where: { id, userId } });
  },

  list(userId: string) {
    return db.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async update(
    userId: string,
    id: string,
    data: Prisma.NoteUncheckedUpdateManyInput,
  ) {
    const result = await db.note.updateMany({ where: { id, userId }, data });
    return result.count === 0 ? null : db.note.findUnique({ where: { id } });
  },

  async delete(userId: string, id: string) {
    const result = await db.note.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};
