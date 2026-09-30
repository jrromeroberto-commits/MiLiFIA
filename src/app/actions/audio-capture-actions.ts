"use server";

import { z } from "zod";
import { extractAudioCapture } from "@/lib/ai/audio-capture-service";
import { AiServiceError } from "@/lib/ai/errors";
import { aiUserErrorMessage } from "@/lib/ai/user-error-message";
import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  AudioUploadValidationError,
} from "@/lib/validation/audio-capture";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";

export type AudioCaptureAnalysisResponse =
  | {
      ok: true;
      transcript: string;
      items: BrainDumpDraft[];
      message: string;
    }
  | { ok: false; transcript: ""; items: []; message: string };

export async function analyzeAudioCaptureAction(
  formData: FormData,
): Promise<AudioCaptureAnalysisResponse> {
  try {
    await requireCurrentUser();
    const audio = formData.get("audio");
    if (!(audio instanceof File)) {
      return {
        ok: false,
        transcript: "",
        items: [],
        message: "Graba o selecciona un audio.",
      };
    }

    const bytes = new Uint8Array(await audio.arrayBuffer());
    const result = await extractAudioCapture({
      bytes,
      declaredMimeType: audio.type,
    });

    return {
      ok: true,
      transcript: result.transcript,
      items: result.items,
      message: `Encontré ${result.items.length} propuesta${result.items.length === 1 ? "" : "s"}. Revisa la transcripción antes de guardar.`,
    };
  } catch (error) {
    if (error instanceof AudioUploadValidationError) {
      return { ok: false, transcript: "", items: [], message: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        transcript: "",
        items: [],
        message: "El audio enviado no es válido.",
      };
    }
    if (error instanceof AiServiceError) {
      return {
        ok: false,
        transcript: "",
        items: [],
        message: aiUserErrorMessage(
          error,
          "No pude transcribir el audio con suficiente seguridad. Prueba con una grabación más clara.",
        ),
      };
    }
    console.error("No se pudo analizar el audio.", error);
    return {
      ok: false,
      transcript: "",
      items: [],
      message: "No pude analizar el audio. Inténtalo nuevamente.",
    };
  }
}
