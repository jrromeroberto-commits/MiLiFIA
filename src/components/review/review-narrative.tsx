"use client";

import { startTransition, useState } from "react";
import {
  generateReviewNarrativeAction,
  type ReviewNarrativeResponse,
} from "@/app/actions/review-actions";
import type { ReviewKind } from "@/services/review-service";

export function ReviewNarrative({ kind }: { kind: ReviewKind }) {
  const [result, setResult] = useState<ReviewNarrativeResponse | null>(null);
  const [pending, setPending] = useState(false);

  function generate() {
    if (pending) return;
    setPending(true);
    startTransition(async () => {
      try {
        setResult(await generateReviewNarrativeAction(kind));
      } catch {
        setResult({
          ok: false,
          narrative: null,
          message: "La conexión se interrumpió antes de recibir la reflexión.",
        });
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 sm:p-6" aria-busy={pending}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Lectura opcional</p>
          <h2 className="section-title">Reflexión con Gemini</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Gemini recibe únicamente los conteos visibles, nunca los títulos ni el contenido de tus registros.
          </p>
        </div>
        <button className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending} onClick={generate} type="button">
          {pending ? "Reflexionando…" : result?.ok ? "Actualizar reflexión" : "Generar reflexión"}
        </button>
      </div>

      {result && !result.ok ? (
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{result.message}</p>
      ) : null}

      {result?.ok ? (
        <div className="mt-6 grid gap-5 border-t border-violet-100 pt-5 lg:grid-cols-[1.2fr_0.8fr]" aria-live="polite">
          <div>
            <p className="text-sm leading-7 text-slate-700">{result.narrative.summary}</p>
            <div className="mt-5 rounded-xl bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-violet-600">Siguiente paso</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{result.narrative.nextStep}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <NarrativeList title="Avances" items={result.narrative.wins} empty="Sin avances destacados por las métricas." />
            <NarrativeList title="Atención" items={result.narrative.attention} empty="Sin alertas destacadas por las métricas." />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function NarrativeList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-600">
          {items.map((item) => <li className="rounded-lg bg-white/70 px-3 py-2" key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
      )}
    </div>
  );
}

