"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/", label: "Inicio", symbol: "⌂" },
  { href: "/chat", label: "Chat", symbol: "✦" },
  { href: "/projects", label: "Proyectos", symbol: "◫" },
  { href: "/inbox", label: "Inbox", symbol: "↓" },
  { href: "/timeline", label: "Timeline", symbol: "◌" },
  { href: "/review/daily", label: "Revisión", symbol: "◷" },
  { href: "/growth", label: "Crecimiento", symbol: "↗" },
];

const mobileNavigation = navigation.filter((item) =>
  ["/", "/chat", "/projects", "/timeline"].includes(item.href),
);
const mobileMoreNavigation = navigation.filter(
  (item) => !mobileNavigation.includes(item),
);

function isCurrentPath(pathname: string, href: string) {
  if (href === "/review/daily") return pathname.startsWith("/review");
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function Navigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = mobileMoreNavigation.some((item) =>
    isCurrentPath(pathname, item.href),
  );

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen border-r border-slate-200/80 bg-white/70 px-4 py-7 backdrop-blur-xl lg:flex lg:flex-col">
        <Link className="flex items-center gap-3 px-3" href="/" aria-label="LifeOS, inicio">
          <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-lg shadow-slate-900/20">
            L
          </span>
          <div>
            <span className="block text-base font-semibold tracking-[-0.03em] text-slate-950">
              LifeOS
            </span>
            <span className="block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-400">
              Segundo cerebro
            </span>
          </div>
        </Link>

        <nav className="mt-10 space-y-1" aria-label="Navegación principal">
          {navigation.map((item) => {
            const active = isCurrentPath(pathname, item.href);

            return (
              <Link
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active
                    ? "bg-violet-50 text-violet-800"
                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`grid size-7 place-items-center rounded-lg text-base ${
                    active ? "bg-white text-violet-700 shadow-sm" : "text-slate-400"
                  }`}
                  aria-hidden="true"
                >
                  {item.symbol}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
          <p className="text-xs font-semibold text-violet-900">Fase 15 · MVP completo</p>
          <p className="mt-1 text-xs leading-5 text-violet-700/70">
            Arquitectura, privacidad y experiencia revisadas de extremo a extremo.
          </p>
        </div>
      </aside>

      <header className="flex items-center justify-between px-4 py-4 sm:px-7 lg:hidden">
        <Link className="flex items-center gap-2" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 font-semibold text-white">
            L
          </span>
          <span className="font-semibold tracking-[-0.03em] text-slate-950">LifeOS</span>
        </Link>
        <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          Fase 15
        </span>
      </header>

      {moreOpen ? (
        <>
          <button
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMoreOpen(false)}
            type="button"
          />
          <nav
            aria-label="Más secciones"
            className="fixed inset-x-3 bottom-20 z-50 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden"
            id="mobile-more-menu"
          >
            {mobileMoreNavigation.map((item) => {
              const active = isCurrentPath(pathname, item.href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold transition ${
                    active
                      ? "bg-violet-50 text-violet-800"
                      : "bg-slate-50 text-slate-600 hover:bg-violet-50"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMoreOpen(false)}
                >
                  <span className="mb-1 text-lg" aria-hidden="true">{item.symbol}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      ) : null}

      <nav
        className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-white/80 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:hidden"
        aria-label="Navegación móvil"
      >
        {mobileNavigation.map((item) => {
          const active = isCurrentPath(pathname, item.href);

          return (
            <Link
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.62rem] font-medium transition sm:text-[0.68rem] ${
                active ? "bg-white/10 text-white" : "text-slate-400"
              }`}
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base" aria-hidden="true">
                {item.symbol}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          aria-controls="mobile-more-menu"
          aria-expanded={moreOpen}
          className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.62rem] font-medium transition sm:text-[0.68rem] ${
            moreOpen || moreActive ? "bg-white/10 text-white" : "text-slate-400"
          }`}
          onClick={() => setMoreOpen((current) => !current)}
          type="button"
        >
          <span className="text-base" aria-hidden="true">•••</span>
          Más
        </button>
      </nav>
    </>
  );
}
