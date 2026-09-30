"use server";

import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { aiUserErrorMessage } from "@/lib/ai/user-error-message";
import { extractImageCapture } from "@/lib/ai/image-capture-service";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";
import { ImageUploadValidationError } from "@/lib/validation/image-capture";

export type ImageCaptureAnalysisResponse =
  | { ok: true; items: BrainDumpDraft[]; message: string }
  | { ok: false; items: []; message: string };

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
      return {
        ok: false,
        items: [],
        message: aiUserErrorMessage(
          error,
          "No pude leer la imagen con suficiente seguridad. Prueba con una foto más nítida.",
        ),
      };
    }
    console.error("No se pudo analizar la imagen.", error);
    return {
      ok: false,
      items: [],
      message: "No pude analizar la imagen. Inténtalo nuevamente.",
    };
  }
}
