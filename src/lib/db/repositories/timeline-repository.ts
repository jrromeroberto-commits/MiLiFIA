import "server-only";

import { db } from "@/lib/db/client";

type TimelineRange = { start: Date; endExclusive: Date };

function createdWithin(userId: string, range: TimelineRange) {
  return {
    userId,
    createdAt: { gte: range.start, lt: range.endExclusive },
  };
}

export const timelineRepository = {
  async list(userId: string, range: TimelineRange) {
    const [projects, tasks, ideas, notes, expenses, habits, habitLogs, goals, files] =
      await Promise.all([
        db.project.findMany({
          where: createdWithin(userId, range),
          select: { id: true, name: true, createdAt: true },
        }),
        db.task.findMany({
          where: {
            userId,
            OR: [
              { createdAt: { gte: range.start, lt: range.endExclusive } },
              { completedAt: { gte: range.start, lt: range.endExclusive } },
            ],
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            completedAt: true,
            project: { select: { id: true, name: true } },
          },
        }),
        db.idea.findMany({
          where: createdWithin(userId, range),
          select: {
            id: true,
            title: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
          },
        }),
        db.note.findMany({
          where: createdWithin(userId, range),
          select: {
            id: true,
            title: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
          },
        }),
        db.expense.findMany({
          where: createdWithin(userId, range),
          select: {
            id: true,
            amount: true,
            currency: true,
            description: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
          },
        }),
        db.habit.findMany({
          where: createdWithin(userId, range),
          select: { id: true, name: true, createdAt: true },
        }),
        db.habitLog.findMany({
          where: createdWithin(userId, range),
          select: {
            id: true,
            value: true,
            createdAt: true,
            habit: { select: { id: true, name: true, unit: true } },
          },
        }),
        db.goal.findMany({
          where: {
            userId,
            OR: [
              { createdAt: { gte: range.start, lt: range.endExclusive } },
              { completedAt: { gte: range.start, lt: range.endExclusive } },
            ],
          },
          select: { id: true, title: true, createdAt: true, completedAt: true },
        }),
        db.projectFile.findMany({
          where: createdWithin(userId, range),
          select: {
            id: true,
            originalName: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
          },
        }),
      ]);

    return { projects, tasks, ideas, notes, expenses, habits, habitLogs, goals, files };
  },
};
