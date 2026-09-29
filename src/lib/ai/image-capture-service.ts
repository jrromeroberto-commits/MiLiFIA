import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiStructuredOutputProvider } from "@/lib/ai/gemini-provider";
import { buildImageCapturePrompt } from "@/lib/ai/image-capture-prompt";
import { imageCaptureJsonSchema } from "@/lib/ai/image-capture-structured-schema";
import type { StructuredOutputProvider } from "@/lib/ai/provider";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";
import {
  imageCaptureResponseSchema,
  validateImageUpload,
} from "@/lib/validation/image-capture";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIME_ZONE = "America/Lima";

const imageExtractionInputSchema = z
  .object({
    bytes: z.instanceof(Uint8Array),
    declaredMimeType: z.string(),
    referenceDate: z.date().optional(),
    timeZone: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

type ExtractImageCaptureOptions = {
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

export function parseImageCaptureResponse(responseText: string): BrainDumpDraft[] {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    throw new AiServiceError("Gemini devolvió JSON inválido para la imagen.", {
      code: "INVALID_RESPONSE",
      retryable: true,
      cause: error,
    });
  }

  try {
    const response = imageCaptureResponseSchema.parse(json);
    return response.items.map((item) => ({ ...item, id: randomUUID() }));
  } catch (error) {
    throw new AiServiceError(
      "La lectura visual de Gemini no cumple el contrato seguro de LifeOS.",
      { code: "INVALID_RESPONSE", retryable: true, cause: error },
    );
  }
}

export async function extractImageCapture(
  input: z.input<typeof imageExtractionInputSchema>,
  options: ExtractImageCaptureOptions = {},
) {
  const validated = imageExtractionInputSchema.parse(input);
  const image = validateImageUpload(validated);
  const timeZone = validated.timeZone ?? process.env.APP_TIMEZONE ?? DEFAULT_TIME_ZONE;
  const prompt = buildImageCapturePrompt({
    localDate: localDate(validated.referenceDate ?? new Date(), timeZone),
    timeZone,
  });
  const provider = options.provider ?? new GeminiStructuredOutputProvider();

  const response = await provider.generateStructuredOutput({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    systemInstruction: prompt.systemInstruction,
    input: prompt.inputText,
    image: {
      data: Buffer.from(image.bytes).toString("base64"),
      mimeType: image.mimeType,
    },
    jsonSchema: imageCaptureJsonSchema,
    maxOutputTokens: 4_096,
  });

  return parseImageCaptureResponse(response);
}
