"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="placeholder-panel">
      <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-xl text-rose-700" aria-hidden="true">
        !
      </span>
      <p className="eyebrow mt-6">Algo interrumpió el flujo</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        No pudimos cargar esta parte de LifeOS
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
        Comprueba que PostgreSQL esté activo. Si ya lo está, puedes intentar nuevamente.
      </p>
      <button
        className="mt-6 min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-violet-700"
        onClick={() => retry()}
        type="button"
      >
        Reintentar
      </button>
    </section>
  );
}
