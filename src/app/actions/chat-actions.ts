"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { AiServiceError } from "@/lib/ai/errors";
import {
  chatContextSchema,
  chatMessageSchema,
  type ChatContextMessage,
} from "@/lib/validation/chat";
import { processChatMessage } from "@/services/chat-service";
import type { ChatResultItem, ChatToolResult } from "@/services/chat-tool-service";

export type ChatActionResponse = {
  ok: boolean;
  intent: ChatToolResult["intent"] | null;
  outcome: ChatToolResult["outcome"] | "error";
  reply: string;
  items: ChatResultItem[];
};

function aiErrorMessage(error: AiServiceError) {
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
      return "No pude interpretar ese mensaje con seguridad. Intenta expresarlo de otra manera.";
    case "PROVIDER":
      return "No pude comunicarme con Gemini. Revisa tu conexión e inténtalo nuevamente.";
  }
}

export async function sendChatMessageAction(
  message: string,
  context: ChatContextMessage[],
): Promise<ChatActionResponse> {
  try {
    const text = chatMessageSchema.parse(message);
    const safeContext = chatContextSchema.parse(context);
    const user = await requireCurrentUser();
    const result = await processChatMessage(user.id, text, {
      context: safeContext,
    });

    if (result.mutated) {
      revalidatePath("/");
      revalidatePath("/projects");
      revalidatePath("/inbox");
      revalidatePath("/growth");
    }

    return {
      ok: true,
      intent: result.intent,
      outcome: result.outcome,
      reply: result.reply,
      items: result.items,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        intent: null,
        outcome: "error",
        reply: "Escribe un mensaje de entre 1 y 10 000 caracteres.",
        items: [],
      };
    }

    if (error instanceof AiServiceError) {
      return {
        ok: false,
        intent: null,
        outcome: "error",
        reply: aiErrorMessage(error),
        items: [],
      };
    }

    console.error("No se pudo procesar el mensaje de LifeOS.", error);
    return {
      ok: false,
      intent: null,
      outcome: "error",
      reply:
        "No pude completar la acción. Verifica que PostgreSQL esté activo y vuelve a intentarlo.",
      items: [],
    };
  }
}
