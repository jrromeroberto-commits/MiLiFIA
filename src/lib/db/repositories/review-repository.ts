import "server-only";

import { db } from "@/lib/db/client";

const pendingStatuses = ["TODO", "IN_PROGRESS"] as const;

export const reviewRepository = {
  async snapshot(
    userId: string,
    input: { start: Date; endExclusive: Date; today: Date },
  ) {
    const [completedTasks, pendingTasks, overdueTasks, newIdeas, projects] =
      await Promise.all([
        db.task.findMany({
          where: {
            userId,
            status: "COMPLETED",
            completedAt: { gte: input.start, lt: input.endExclusive },
          },
          orderBy: { completedAt: "desc" },
        }),
        db.task.findMany({
          where: { userId, status: { in: [...pendingStatuses] } },
          orderBy: [
            { dueDate: { sort: "asc", nulls: "last" } },
            { createdAt: "desc" },
          ],
        }),
        db.task.findMany({
          where: {
            userId,
            status: { in: [...pendingStatuses] },
            dueDate: { lt: input.today },
          },
          orderBy: { dueDate: "asc" },
        }),
        db.idea.findMany({
          where: {
            userId,
            createdAt: { gte: input.start, lt: input.endExclusive },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.project.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
            tasks: {
              where: { updatedAt: { gte: input.start, lt: input.endExclusive } },
              select: { id: true },
            },
            ideas: {
              where: { updatedAt: { gte: input.start, lt: input.endExclusive } },
              select: { id: true },
            },
            notes: {
              where: { updatedAt: { gte: input.start, lt: input.endExclusive } },
              select: { id: true },
            },
          },
          orderBy: { name: "asc" },
        }),
      ]);

    return { completedTasks, pendingTasks, overdueTasks, newIdeas, projects };
  },
};

