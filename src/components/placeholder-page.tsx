import Link from "next/link";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  preview: string;
  action?: {
    href: string;
    label: string;
  };
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  preview,
  action,
}: PlaceholderPageProps) {
  return (
    <section className="placeholder-panel">
      <span className="grid size-14 place-items-center rounded-2xl bg-violet-100 text-xl text-violet-700">
        ✦
      </span>
      <p className="eyebrow mt-6">{eyebrow}</p>
      <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
        {description}
      </p>
      <div className="mt-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Vista previa
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{preview}</p>
      </div>
      {action ? (
        <Link
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-violet-700"
          href={action.href}
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
