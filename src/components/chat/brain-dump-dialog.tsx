"use client";

import Link from "next/link";
import {
  startTransition,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  analyzeBrainDumpAction,
  saveBrainDumpAction,
  type BrainDumpSaveResponse,
} from "@/app/actions/brain-dump-actions";
import { useModalDialog } from "@/components/chat/use-modal-dialog";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";

type Stage = "input" | "review" | "saved";

const typeLabels = {
  TASK: "Tarea",
  PROJECT: "Proyecto",
  IDEA: "Idea",
  NOTE: "Nota",
  UNKNOWN: "Por aclarar",
} as const;

const priorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
} as const;

function nullable(value: string) {
  return value.trim() ? value : null;
}

export function BrainDumpDialog() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [items, setItems] = useState<BrainDumpDraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<BrainDumpSaveResponse | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function resetDialog() {
    setStage("input");
    setText("");
    setItems([]);
    setSelected(new Set());
    setFeedback(null);
    setSavedResult(null);
  }

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    resetDialog();
  }

  const { dialogRef, triggerRef } = useModalDialog({
    open,
    pending,
    onClose: closeDialog,
    initialFocusRef: inputRef,
  });

  function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await analyzeBrainDumpAction(text);
        setFeedback(result.message);
        if (result.ok) {
          setItems(result.items);
          setSelected(
            new Set(
              result.items
                .filter((item) => item.itemType !== "UNKNOWN")
                .map((item) => item.id),
            ),
          );
          setStage("review");
        }
      } catch {
        setFeedback("La conexión se interrumpió. Inténtalo nuevamente.");
      } finally {
        setPending(false);
      }
    });
  }

  function save() {
    if (pending) return;
    const chosen = items.filter((item) => selected.has(item.id));
    if (!chosen.length) {
      setFeedback("Selecciona al menos una propuesta para guardar.");
      return;
    }

    setPending(true);
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await saveBrainDumpAction(chosen);
        setSavedResult(result);
        setFeedback(result.message);
        if (result.ok) setStage("saved");
      } catch {
        setFeedback("La conexión se interrumpió. No se guardó nada.");
      } finally {
        setPending(false);
      }
    });
  }

  function updateItem(id: string, change: Partial<BrainDumpDraft>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className="mr-2 text-base" aria-hidden="true">✦</span>
        Vaciar mi cabeza
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <section
            aria-busy={pending}
            aria-describedby="brain-dump-description"
            aria-labelledby="brain-dump-title"
            aria-modal="true"
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-[1.75rem]"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="eyebrow">Captura múltiple</p>
                <h2 id="brain-dump-title" className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                  Vaciar mi cabeza
                </h2>
                <p id="brain-dump-description" className="mt-1 text-sm leading-5 text-slate-500">
                  Gemini propone; tú corriges y confirmas antes de guardar.
                </p>
              </div>
              <button
                aria-label="Cerrar"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                disabled={pending}
                onClick={closeDialog}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {stage === "input" ? (
                <form id="brain-dump-form" onSubmit={analyze}>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="brain-dump-text">
                    Escribe todo, sin preocuparte por el orden
                  </label>
                  <textarea
                    className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    disabled={pending}
                    id="brain-dump-text"
                    maxLength={20_000}
                    minLength={10}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Ejemplo: mañana revisar la tesis, pagar internet y tuve una idea para una aplicación de viajes…"
                    ref={inputRef}
                    required
                    value={text}
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>Puede ser un párrafo largo y desordenado.</span>
                    <span>{text.length.toLocaleString("es")} / 20 000</span>
                  </div>
                </form>
              ) : null}

              {stage === "review" ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
                    <p>{feedback}</p>
                    <p className="shrink-0 font-semibold">{selected.size} de {items.length} seleccionadas</p>
                  </div>
                  {items.map((item, index) => (
                    <DraftCard
                      item={item}
                      index={index}
                      key={item.id}
                      onChange={(change) => updateItem(item.id, change)}
                      onToggle={() => toggleSelected(item.id)}
                      selected={selected.has(item.id)}
                    />
                  ))}
                </div>
              ) : null}

              {stage === "saved" && savedResult?.ok ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">✓</span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">Tu mente quedó organizada</h3>
                  <p className="mt-2 text-sm text-slate-500">{savedResult.message}</p>
                  <ul className="mx-auto mt-6 max-w-lg space-y-2 text-left">
                    {savedResult.saved.map((item) => (
                      <li key={item.id}>
                        <Link className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-violet-200 hover:bg-violet-50" href={item.href} onClick={closeDialog}>
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.created ? typeLabels[item.itemType] : "Ya existía"}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {feedback && stage !== "review" && stage !== "saved" ? (
                <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p>
              ) : null}
              {feedback && stage === "review" && savedResult && !savedResult.ok ? (
                <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p>
              ) : null}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              {stage === "input" ? (
                <>
                  <button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button>
                  <button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || text.trim().length < 10} form="brain-dump-form" type="submit">{pending ? "Separando ideas…" : "Revisar propuestas"}</button>
                </>
              ) : null}
              {stage === "review" ? (
                <>
                  <button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button>
                  <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700" disabled={pending} onClick={() => { setStage("input"); setFeedback(null); setSavedResult(null); }} type="button">Editar texto</button>
                  <button className="min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || selected.size === 0} onClick={save} type="button">{pending ? "Guardando…" : selected.size === items.length ? "Guardar todo" : "Guardar seleccionados"}</button>
                </>
              ) : null}
              {stage === "saved" ? (
                <button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700" onClick={closeDialog} type="button">Cerrar</button>
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function DraftCard({
  item,
  index,
  selected,
  onToggle,
  onChange,
  allowedTypes,
}: {
  item: BrainDumpDraft;
  index: number;
  selected: boolean;
  onToggle: () => void;
  onChange: (change: Partial<BrainDumpDraft>) => void;
  allowedTypes?: BrainDumpDraft["itemType"][];
}) {
  const isUnknown = item.itemType === "UNKNOWN";
  const visibleTypes =
    allowedTypes ??
    (Object.keys(typeLabels) as BrainDumpDraft["itemType"][]);

  return (
    <article className={`rounded-2xl border p-4 transition sm:p-5 ${selected ? "border-violet-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50 opacity-75"}`}>
      <div className="flex items-start gap-3">
        <input aria-label={`Seleccionar propuesta ${index + 1}`} checked={selected} className="mt-1 size-4 accent-violet-600" onChange={onToggle} type="checkbox" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Propuesta {index + 1}</p>
            <select aria-label="Tipo de propuesta" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300" onChange={(event) => onChange({ itemType: event.target.value as BrainDumpDraft["itemType"] })} value={item.itemType}>
              {visibleTypes.map((value) => <option key={value} value={value}>{typeLabels[value]}</option>)}
            </select>
          </div>

          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs italic leading-5 text-slate-500">“{item.sourceText}”</p>

          {isUnknown ? (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Necesita aclaración</p>
              <p className="mt-1">{item.clarificationQuestion}</p>
              <p className="mt-2 text-xs">Cambia el tipo y completa sus datos, o déjala sin seleccionar.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {item.itemType === "PROJECT" ? (
                <Field label="Nombre" value={item.name ?? ""} onChange={(value) => onChange({ name: nullable(value) })} required />
              ) : (
                <Field label={item.itemType === "NOTE" ? "Título (opcional)" : "Título"} value={item.title ?? ""} onChange={(value) => onChange({ title: nullable(value) })} required={item.itemType !== "NOTE"} />
              )}
              {(item.itemType === "TASK" || item.itemType === "IDEA" || item.itemType === "NOTE") ? (
                <Field label="Proyecto (opcional)" value={item.projectName ?? ""} onChange={(value) => onChange({ projectName: nullable(value) })} />
              ) : null}
              {(item.itemType === "TASK" || item.itemType === "IDEA" || item.itemType === "PROJECT") ? (
                <Field className="sm:col-span-2" label="Descripción (opcional)" value={item.description ?? ""} onChange={(value) => onChange({ description: nullable(value) })} />
              ) : null}
              {item.itemType === "NOTE" ? (
                <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Contenido<textarea className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-5 text-slate-900 outline-none focus:border-violet-300 focus:ring-3 focus:ring-violet-100" onChange={(event) => onChange({ content: nullable(event.target.value) })} required value={item.content ?? ""} /></label>
              ) : null}
              {item.itemType === "TASK" ? (
                <>
                  <Field label="Fecha límite (opcional)" type="date" value={item.dueDate ?? ""} onChange={(value) => onChange({ dueDate: nullable(value) })} />
                  <label className="text-xs font-semibold text-slate-600">Prioridad<select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-violet-300" onChange={(event) => onChange({ priority: event.target.value ? event.target.value as BrainDumpDraft["priority"] : null })} value={item.priority ?? ""}><option value="">Automática (media)</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Field({ label, value, onChange, required = false, type = "text", className = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: "text" | "date"; className?: string }) {
  return (
    <label className={`text-xs font-semibold text-slate-600 ${className}`}>{label}<input className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-violet-300 focus:ring-3 focus:ring-violet-100" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>
  );
}
