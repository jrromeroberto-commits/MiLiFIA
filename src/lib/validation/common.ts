import { z } from "zod";

export const entityIdSchema = z.string().uuid();

export const optionalDescriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(5_000)
  .nullable()
  .optional();

export function requireAtLeastOneField<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value).length > 0;
}
