"use server";

import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { extractImageCapture } from "@/lib/ai/image-capture-service";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";
import { ImageUploadValidationError } from "@/lib/validation/image-capture";

export type ImageCaptureAnalysisResponse =
  | { ok: true; items: BrainDumpDraft[]; message: string }
  | { ok: false; items: []; message: string };

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
      return "No pude leer la imagen con suficiente seguridad. Prueba con una foto más nítida.";
    case "PROVIDER":
      return "No pude comunicarme con Gemini. Revisa tu conexión e inténtalo nuevamente.";
  }
}

export async function analyzeImageCaptureAction(
  formData: FormData,
): Promise<ImageCaptureAnalysisResponse> {
  try {
    await requireCurrentUser();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return { ok: false, items: [], message: "Selecciona una imagen." };
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    const items = await extractImageCapture({
      bytes,
      declaredMimeType: image.type,
    });

    return {
      ok: true,
      items,
      message: `Encontré ${items.length} propuesta${items.length === 1 ? "" : "s"}. Confirma solo lo que coincida con la imagen.`,
    };
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      return { ok: false, items: [], message: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false, items: [], message: "La imagen enviada no es válida." };
    }
    if (error instanceof AiServiceError) {
      return { ok: false, items: [], message: aiErrorMessage(error) };
    }
    console.error("No se pudo analizar la imagen.", error);
    return {
      ok: false,
      items: [],
      message: "No pude analizar la imagen. Inténtalo nuevamente.",
    };
  }
}
