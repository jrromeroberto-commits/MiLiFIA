import { z } from "zod";

export const chatMessageSchema = z.string().trim().min(1).max(10_000);

export const chatContextSchema = z
  .array(
    z
      .object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2_000),
      })
      .strict(),
  )
  .max(6);

export type ChatContextMessage = z.infer<typeof chatContextSchema>[number];
