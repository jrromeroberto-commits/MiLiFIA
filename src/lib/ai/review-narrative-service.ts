import "server-only";

import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiStructuredOutputProvider } from "@/lib/ai/gemini-provider";
import type { StructuredOutputProvider } from "@/lib/ai/provider";
import type { ReviewReport } from "@/services/review-service";

const reviewNarrativeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    wins: { type: "array", items: { type: "string" }, maxItems: 3 },
    attention: { type: "array", items: { type: "string" }, maxItems: 3 },
    nextStep: { type: "string" },
  },
  required: ["summary", "wins", "attention", "nextStep"],
} as const;

const reviewNarrativeSchema = z
  .object({
    summary: z.string().trim().min(1).max(800),
    wins: z.array(z.string().trim().min(1).max(300)).max(3),
    attention: z.array(z.string().trim().min(1).max(300)).max(3),
    nextStep: z.string().trim().min(1).max(400),
  })
  .strict();

export type ReviewNarrative = z.infer<typeof reviewNarrativeSchema>;

type ReviewNarrativeOptions = {
  provider?: StructuredOutputProvider;
};

export function parseReviewNarrative(responseText: string): ReviewNarrative {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    throw new AiServiceError("Gemini devolvió una reflexión con JSON inválido.", {
      code: "INVALID_RESPONSE",
      retryable: true,
      cause: error,
    });
  }

  try {
    return reviewNarrativeSchema.parse(json);
  } catch (error) {
    throw new AiServiceError(
      "La reflexión de Gemini no cumple el contrato seguro de LifeOS.",
      { code: "INVALID_RESPONSE", retryable: true, cause: error },
    );
  }
}

export async function generateReviewNarrative(
  report: ReviewReport,
  options: ReviewNarrativeOptions = {},
) {
  const provider = options.provider ?? new GeminiStructuredOutputProvider();
  const metrics = report.metrics.map(({ label, value, detail }) => ({
    label,
    value,
    detail,
  }));
  const responseText = await provider.generateStructuredOutput({
    model: process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite",
    systemInstruction: `Eres el redactor de revisiones personales de LifeOS.
Recibirás exclusivamente métricas agregadas y confiables calculadas por el backend.
Redacta en español claro, sobrio y breve. No inventes tareas, proyectos, nombres, causas ni logros.
Usa los números exactamente como se proporcionan. Si una métrica es cero, no la conviertas en un hecho positivo o negativo inexistente.
Devuelve solo JSON válido conforme al esquema.`,
    input: JSON.stringify({
      review: report.kind,
      period: report.periodLabel,
      metrics,
    }),
    jsonSchema: reviewNarrativeJsonSchema,
    maxOutputTokens: 1_024,
  });

  return parseReviewNarrative(responseText);
}

