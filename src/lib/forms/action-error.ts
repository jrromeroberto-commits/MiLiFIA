import "server-only";
import { ZodError } from "zod";
import type { ActionState } from "@/lib/forms/action-state";
import { EntityNotFoundError } from "@/services/errors";

type ErrorWithCode = { code?: unknown };

export function actionErrorState(
  error: unknown,
  fallbackMessage: string,
): ActionState {
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: "Revisa los campos obligatorios y vuelve a intentarlo.",
    };
  }

  if (error instanceof EntityNotFoundError) {
    return { status: "error", message: error.message };
  }

  if ((error as ErrorWithCode)?.code === "P2002") {
    return {
      status: "error",
      message: "Ya existe un proyecto con ese nombre.",
    };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}
