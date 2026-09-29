import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiStructuredOutputProvider } from "@/lib/ai/gemini-provider";
import { buildBrainDumpPrompt } from "@/lib/ai/brain-dump-prompt";
import { brainDumpJsonSchema } from "@/lib/ai/brain-dump-structured-schema";
import type { StructuredOutputProvider } from "@/lib/ai/provider";
import {
  brainDumpTextSchema,
  rawBrainDumpResponseSchema,
  type BrainDumpDraft,
} from "@/lib/validation/brain-dump";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIME_ZONE = "America/Lima";

const extractionInputSchema = z
  .object({
    text: brainDumpTextSchema,
    referenceDate: z.date().optional(),
    timeZone: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

type ExtractBrainDumpOptions = {
  provider?: StructuredOutputProvider;
};

function localDate(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (error) {
    throw new AiServiceError(`La zona horaria ${timeZone} no es válida.`, {
      code: "CONFIGURATION",
      cause: error,
    });
  }
}

export function parseBrainDumpResponse(responseText: string): BrainDumpDraft[] {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    throw new AiServiceError("Gemini devolvió JSON inválido para la captura.", {
      code: "INVALID_RESPONSE",
      retryable: true,
      cause: error,
    });
  }

  try {
    const response = rawBrainDumpResponseSchema.parse(json);
    return response.items.map((item) => ({ ...item, id: randomUUID() }));
  } catch (error) {
    throw new AiServiceError(
      "La captura de Gemini no cumple el contrato seguro de LifeOS.",
      { code: "INVALID_RESPONSE", retryable: true, cause: error },
    );
  }
}

export async function extractBrainDump(
  input: z.input<typeof extractionInputSchema>,
  options: ExtractBrainDumpOptions = {},
) {
  const validated = extractionInputSchema.parse(input);
  const timeZone = validated.timeZone ?? process.env.APP_TIMEZONE ?? DEFAULT_TIME_ZONE;
  const prompt = buildBrainDumpPrompt({
    text: validated.text,
    localDate: localDate(validated.referenceDate ?? new Date(), timeZone),
    timeZone,
  });
  const provider = options.provider ?? new GeminiStructuredOutputProvider();

  const response = await provider.generateStructuredOutput({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    systemInstruction: prompt.systemInstruction,
    input: prompt.input,
    jsonSchema: brainDumpJsonSchema,
    maxOutputTokens: 4_096,
  });

  return parseBrainDumpResponse(response);
}
