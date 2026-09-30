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

  findDetailById(userId: string, id: string) {
    return db.project.findFirst({
      where: { id, userId },
      include: {
        tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
        ideas: { orderBy: { updatedAt: "desc" } },
        notes: { orderBy: { updatedAt: "desc" } },
        files: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            processingStatus: true,
            textTruncated: true,
            pageCount: true,
            createdAt: true,
            _count: { select: { chunks: true } },
          },
        },
      },
    });
  },

  list(userId: string) {
    return db.project.findMany({
      where: { userId },
      include: {
        _count: { select: { tasks: true, ideas: true, notes: true, files: true } },
      },
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
