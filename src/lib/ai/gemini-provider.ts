import "server-only";

import { ApiError, GoogleGenAI } from "@google/genai";
import { AiServiceError } from "@/lib/ai/errors";
import type { IntentModelProvider, IntentModelRequest } from "@/lib/ai/provider";

type GeminiIntentProviderOptions = {
  apiKey?: string;
};

export class GeminiIntentProvider implements IntentModelProvider {
  private readonly client: GoogleGenAI;

  constructor(options: GeminiIntentProviderOptions = {}) {
    const apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY)?.trim();

    if (!apiKey) {
      throw new AiServiceError(
        "Falta GEMINI_API_KEY. Agrégala manualmente en el archivo .env.",
        { code: "CONFIGURATION" },
      );
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  async generateStructuredIntent(request: IntentModelRequest) {
    try {
      const interaction = await this.client.interactions.create(
        {
          model: request.model,
          input: request.input,
          system_instruction: request.systemInstruction,
          generation_config: {
            max_output_tokens: 1_024,
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: request.jsonSchema,
          },
          store: false,
        },
        {
          timeout_ms: 60_000,
          retries: { strategy: "none" },
        },
      );

      if (!interaction.output_text?.trim()) {
        throw new AiServiceError(
          "Gemini no devolvió contenido estructurado para interpretar.",
          { code: "INVALID_RESPONSE", retryable: true },
        );
      }

      return interaction.output_text;
    } catch (error) {
      if (error instanceof AiServiceError) {
        throw error;
      }

      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          throw new AiServiceError(
            "Gemini rechazó la credencial configurada.",
            { code: "AUTHENTICATION", cause: error },
          );
        }

        if (error.status === 429) {
          throw new AiServiceError(
            "Gemini alcanzó temporalmente su límite de solicitudes.",
            { code: "RATE_LIMIT", retryable: true, cause: error },
          );
        }

        if (error.status === 408 || error.status >= 500) {
          throw new AiServiceError(
            "Gemini no está disponible temporalmente.",
            { code: "UNAVAILABLE", retryable: true, cause: error },
          );
        }
      }

      throw new AiServiceError("No se pudo consultar Gemini.", {
        code: "PROVIDER",
        retryable: true,
        cause: error,
      });
    }
  }
}
