import Link from "next/link";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <section className="placeholder-panel" aria-labelledby="offline-title">
      <span className="grid size-14 place-items-center rounded-2xl bg-violet-100 text-xl font-semibold text-violet-700" aria-hidden="true">
        L
      </span>
      <p className="eyebrow mt-6">Sin conexión</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950" id="offline-title">
        LifeOS necesita conexión para acceder a tus datos
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
        Por privacidad, las páginas que contienen proyectos, tareas y documentos no se guardan en la caché del navegador.
      </p>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700" href="/">
        Volver a intentar
      </Link>
    </section>
  );
}
