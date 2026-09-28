import type { ActionState } from "@/lib/forms/action-state";

export function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;

  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}
