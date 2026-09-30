import "server-only";

import type { AiServiceError } from "@/lib/ai/errors";

export function aiUserErrorMessage(
  error: AiServiceError,
  invalidResponseMessage: string,
) {
  switch (error.code) {
    case "CONFIGURATION":
      return "Gemini todavía no está configurado. Revisa GEMINI_API_KEY en tu archivo .env.";
    case "AUTHENTICATION":
      return "Gemini rechazó la clave configurada. Revisa la credencial en Google AI Studio.";
    case "RATE_LIMIT":
      return "Gemini alcanzó temporalmente su límite de uso. Espera un momento y vuelve a intentarlo.";
    case "UNAVAILABLE":
      return "Gemini no está disponible en este momento. Inténtalo nuevamente en unos minutos.";
    case "INVALID_RESPONSE":
      return invalidResponseMessage;
    case "PROVIDER":
      return "No pude comunicarme con Gemini. Revisa tu conexión e inténtalo nuevamente.";
  }
}
