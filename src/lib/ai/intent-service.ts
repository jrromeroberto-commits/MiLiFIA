import "server-only";

import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiIntentProvider } from "@/lib/ai/gemini-provider";
import {
  rawIntentResponseSchema,
  toLifeOSIntent,
  type LifeOSIntent,
} from "@/lib/ai/intent-schema";
import { buildIntentPrompt } from "@/lib/ai/prompt";
import type { IntentModelProvider } from "@/lib/ai/provider";
import { lifeOSIntentJsonSchema } from "@/lib/ai/structured-schema";
import { chatContextSchema } from "@/lib/validation/chat";

const interpretationInputSchema = z
  .object({
    text: z.string().trim().min(1).max(10_000),
    referenceDate: z.date().optional(),
    timeZone: z.string().trim().min(1).max(100).optional(),
    context: chatContextSchema.optional(),
  })
  .strict();

export type InterpretLifeOSTextInput = z.input<typeof interpretationInputSchema>;

type InterpretLifeOSTextOptions = {
  provider?: IntentModelProvider;
};

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIME_ZONE = "America/Lima";

function getLocalDate(date: Date, timeZone: string) {
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

export function parseIntentResponse(responseText: string): LifeOSIntent {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(responseText);
  } catch (error) {
    throw new AiServiceError("Gemini devolvió JSON inválido.", {
      code: "INVALID_RESPONSE",
      retryable: true,
      cause: error,
    });
  }

  try {
    const rawIntent = rawIntentResponseSchema.parse(parsedJson);
    return toLifeOSIntent(rawIntent);
  } catch (error) {
    throw new AiServiceError(
      "La respuesta de Gemini no cumple el contrato seguro de LifeOS.",
      {
        code: "INVALID_RESPONSE",
        retryable: true,
        cause: error,
      },
    );
  }
}

export async function interpretLifeOSText(
  input: InterpretLifeOSTextInput,
  options: InterpretLifeOSTextOptions = {},
) {
  const validatedInput = interpretationInputSchema.parse(input);
  const timeZone =
    validatedInput.timeZone ?? process.env.APP_TIMEZONE ?? DEFAULT_TIME_ZONE;
  const referenceDate = validatedInput.referenceDate ?? new Date();
  const prompt = buildIntentPrompt({
    text: validatedInput.text,
    localDate: getLocalDate(referenceDate, timeZone),
    timeZone,
    context: validatedInput.context ?? [],
  });
  const provider = options.provider ?? new GeminiIntentProvider();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const responseText = await provider.generateStructuredIntent({
    model,
    systemInstruction: prompt.systemInstruction,
    input: prompt.input,
    jsonSchema: lifeOSIntentJsonSchema,
  });

  return parseIntentResponse(responseText);
}
