import { z } from "zod";
import { isoDateSchema } from "@/lib/ai/intent-schema";

export const timelinePeriodSchema = z.enum(["daily", "weekly"]);

export const timelineQuerySchema = z
  .object({
    period: timelinePeriodSchema,
    date: isoDateSchema,
  })
  .strict();

export type TimelinePeriod = z.infer<typeof timelinePeriodSchema>;
export type TimelineQuery = z.input<typeof timelineQuerySchema>;
