import { z } from "zod";

export const habitPeriodSchema = z.enum(["DAILY", "WEEKLY"]);
export const habitUnitSchema = z.string().trim().min(1).max(40);
export const habitValueSchema = z.number().positive().max(1_000_000);

export const createHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(5_000).nullable().optional(),
    period: habitPeriodSchema,
    targetCount: z.number().int().min(1).max(365).nullable().optional(),
    unit: habitUnitSchema.default("sesiones"),
  })
  .strict();

export const logHabitSchema = z
  .object({
    habitId: z.string().uuid(),
    value: habitValueSchema,
    date: z.date(),
    note: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

export const createGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().min(1).max(5_000).nullable().optional(),
    targetDate: z.date().nullable().optional(),
  })
  .strict();

export type CreateHabitInput = z.input<typeof createHabitSchema>;
export type LogHabitInput = z.input<typeof logHabitSchema>;
export type CreateGoalInput = z.input<typeof createGoalSchema>;
