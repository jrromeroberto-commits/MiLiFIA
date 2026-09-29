"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiServiceError } from "@/lib/ai/errors";
import { extractBrainDump } from "@/lib/ai/brain-dump-service";
import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  brainDumpTextSchema,
  confirmedBrainDumpSchema,
  type BrainDumpDraft,
} from "@/lib/validation/brain-dump";
import {
  BrainDumpValidationError,
  saveConfirmedBrainDump,
  type SavedBrainDumpItem,
} from "@/services/brain-dump-service";

export type BrainDumpAnalysisResponse =
  | { ok: true; items: BrainDumpDraft[]; message: string }
  | { ok: false; items: []; message: string };

export type BrainDumpSaveResponse =
  | { ok: true; saved: SavedBrainDumpItem[]; message: string }
  | { ok: false; saved: []; message: string };

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
      return "No pude separar el texto con suficiente seguridad. Prueba expresándolo de otra forma.";
    case "PROVIDER":
      return "No pude comunicarme con Gemini. Revisa tu conexión e inténtalo nuevamente.";
  }
}

export async function analyzeBrainDumpAction(
  text: string,
): Promise<BrainDumpAnalysisResponse> {
  try {
    const safeText = brainDumpTextSchema.parse(text);
    await requireCurrentUser();
    const items = await extractBrainDump({ text: safeText });
    return {
      ok: true,
      items,
      message: `Encontré ${items.length} propuesta${items.length === 1 ? "" : "s"}. Revísalas antes de guardar.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        items: [],
        message: "Escribe al menos 10 y como máximo 20 000 caracteres.",
      };
    }
    if (error instanceof AiServiceError) {
      return { ok: false, items: [], message: aiErrorMessage(error) };
    }
    console.error("No se pudo analizar el vaciado mental.", error);
    return {
      ok: false,
      items: [],
      message: "No pude analizar el texto. Verifica PostgreSQL e inténtalo nuevamente.",
    };
  }
}

export async function saveBrainDumpAction(
  input: BrainDumpDraft[],
): Promise<BrainDumpSaveResponse> {
  try {
    const items = confirmedBrainDumpSchema.parse(input);
    const user = await requireCurrentUser();
    const saved = await saveConfirmedBrainDump(user.id, items);

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/inbox");

    const createdCount = saved.filter((item) => item.created).length;
    const existingCount = saved.length - createdCount;
    return {
      ok: true,
      saved,
      message: `${createdCount} elemento${createdCount === 1 ? "" : "s"} guardado${createdCount === 1 ? "" : "s"}${existingCount ? `; ${existingCount} proyecto${existingCount === 1 ? " ya existía" : "s ya existían"}` : ""}.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        saved: [],
        message: error.issues[0]?.message ?? "Revisa las propuestas antes de guardar.",
      };
    }
    if (error instanceof BrainDumpValidationError) {
      return { ok: false, saved: [], message: error.message };
    }
    console.error("No se pudo guardar el vaciado mental.", error);
    return {
      ok: false,
      saved: [],
      message: "No se guardó nada. Verifica PostgreSQL e inténtalo nuevamente.",
    };
  }
}

