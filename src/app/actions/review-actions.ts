"use server";

import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import {
  generateReviewNarrative,
  type ReviewNarrative,
} from "@/lib/ai/review-narrative-service";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getReviewReport } from "@/services/review-service";

const reviewKindSchema = z.enum(["daily", "weekly"]);

export type ReviewNarrativeResponse =
  | { ok: true; narrative: ReviewNarrative; message: string }
  | { ok: false; narrative: null; message: string };

function aiErrorMessage(error: AiServiceError) {
  switch (error.code) {
    case "CONFIGURATION":
      return "Gemini todavía no está configurado. Revisa GEMINI_API_KEY en .env.";
    case "AUTHENTICATION":
      return "Gemini rechazó la clave configurada. Revisa la credencial.";
    case "RATE_LIMIT":
      return "Gemini alcanzó temporalmente su límite. Espera un momento e inténtalo otra vez.";
    case "UNAVAILABLE":
      return "Gemini no está disponible ahora. Inténtalo nuevamente en unos minutos.";
    case "INVALID_RESPONSE":
      return "Gemini no pudo redactar una reflexión segura con estas métricas.";
    case "PROVIDER":
      return "No pude comunicarme con Gemini. Revisa tu conexión e inténtalo nuevamente.";
  }
}

export async function generateReviewNarrativeAction(
  kind: "daily" | "weekly",
): Promise<ReviewNarrativeResponse> {
  try {
    const safeKind = reviewKindSchema.parse(kind);
    const user = await requireCurrentUser();
    const report = await getReviewReport(user.id, safeKind);
    const narrative = await generateReviewNarrative(report);

    return {
      ok: true,
      narrative,
      message: "Reflexión generada a partir de las métricas actuales.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, narrative: null, message: "El tipo de revisión no es válido." };
    }
    if (error instanceof AiServiceError) {
      return { ok: false, narrative: null, message: aiErrorMessage(error) };
    }

    console.error("No se pudo generar la reflexión de la revisión.", error);
    return {
      ok: false,
      narrative: null,
      message: "No pude generar la reflexión. Verifica PostgreSQL e inténtalo nuevamente.",
    };
  }
}

