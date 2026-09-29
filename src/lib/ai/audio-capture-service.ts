import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { buildAudioCapturePrompt } from "@/lib/ai/audio-capture-prompt";
import { audioCaptureJsonSchema } from "@/lib/ai/audio-capture-structured-schema";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiStructuredOutputProvider } from "@/lib/ai/gemini-provider";
import type { StructuredOutputProvider } from "@/lib/ai/provider";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";
import {
  audioCaptureResponseSchema,
  validateAudioUpload,
} from "@/lib/validation/audio-capture";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIME_ZONE = "America/Lima";

const audioExtractionInputSchema = z
  .object({
    bytes: z.instanceof(Uint8Array),
    declaredMimeType: z.string(),
    referenceDate: z.date().optional(),
    timeZone: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

type ExtractAudioCaptureOptions = {
  provider?: StructuredOutputProvider;
};

export type AudioCaptureResult = {
  transcript: string;
  items: BrainDumpDraft[];
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

export function parseAudioCaptureResponse(
  responseText: string,
): AudioCaptureResult {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    throw new AiServiceError("Gemini devolvió JSON inválido para el audio.", {
      code: "INVALID_RESPONSE",
      retryable: true,
      cause: error,
    });
  }

  try {
    const response = audioCaptureResponseSchema.parse(json);
    return {
      transcript: response.transcript,
      items: response.items.map((item) => ({ ...item, id: randomUUID() })),
    };
  } catch (error) {
    throw new AiServiceError(
      "La transcripción de Gemini no cumple el contrato seguro de LifeOS.",
      { code: "INVALID_RESPONSE", retryable: true, cause: error },
    );
  }
}

export async function extractAudioCapture(
  input: z.input<typeof audioExtractionInputSchema>,
  options: ExtractAudioCaptureOptions = {},
) {
  const validated = audioExtractionInputSchema.parse(input);
  const audio = validateAudioUpload(validated);
  const timeZone = validated.timeZone ?? process.env.APP_TIMEZONE ?? DEFAULT_TIME_ZONE;
  const prompt = buildAudioCapturePrompt({
    localDate: localDate(validated.referenceDate ?? new Date(), timeZone),
    timeZone,
  });
  const provider = options.provider ?? new GeminiStructuredOutputProvider();

  const response = await provider.generateStructuredOutput({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    systemInstruction: prompt.systemInstruction,
    input: prompt.inputText,
    audio: {
      data: Buffer.from(audio.bytes).toString("base64"),
      mimeType: audio.mimeType,
    },
    jsonSchema: audioCaptureJsonSchema,
    maxOutputTokens: 4_096,
  });

  return parseAudioCaptureResponse(response);
}
