"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "quiet";
};

export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-slate-950 text-white hover:bg-violet-700",
    secondary: "bg-violet-100 text-violet-800 hover:bg-violet-200",
    quiet: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${styles[variant]}`}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
