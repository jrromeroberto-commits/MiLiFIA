"use client";

import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { analyzeImageCaptureAction } from "@/app/actions/image-capture-actions";
import {
  saveBrainDumpAction,
  type BrainDumpSaveResponse,
} from "@/app/actions/brain-dump-actions";
import { DraftCard } from "@/components/chat/brain-dump-dialog";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/validation/image-capture";

type Stage = "input" | "review" | "saved";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const editableTypes: BrainDumpDraft["itemType"][] = [
  "TASK",
  "IDEA",
  "NOTE",
  "UNKNOWN",
];
const typeLabels = {
  TASK: "Tarea",
  PROJECT: "Proyecto",
  IDEA: "Idea",
  NOTE: "Nota",
  UNKNOWN: "Por aclarar",
} as const;

export function ImageCaptureDialog() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("input");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [items, setItems] = useState<BrainDumpDraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<BrainDumpSaveResponse | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) closeDialog();
    };
    window.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  function resetDialog() {
    setStage("input");
    setFile(null);
    setPreviewUrl(null);
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

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFeedback(null);
    setItems([]);
    setSelected(new Set());
    setSavedResult(null);

    if (!nextFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!acceptedTypes.includes(nextFile.type)) {
      setFile(null);
      setPreviewUrl(null);
      setFeedback("Usa una imagen JPEG, PNG o WebP.");
      event.target.value = "";
      return;
    }
    if (nextFile.size > MAX_IMAGE_UPLOAD_BYTES) {
      setFile(null);
      setPreviewUrl(null);
      setFeedback("La imagen supera el límite de 5 MB.");
      event.target.value = "";
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || pending) return;
    setPending(true);
    setFeedback(null);

    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      try {
        const result = await analyzeImageCaptureAction(formData);
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
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="mr-2 text-base" aria-hidden="true">▣</span>
        Analizar imagen
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <section
            aria-busy={pending}
            aria-describedby="image-capture-description"
            aria-labelledby="image-capture-title"
            aria-modal="true"
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-[1.75rem]"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="eyebrow">Captura visual</p>
                <h2 id="image-capture-title" className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                  Organizar desde una imagen
                </h2>
                <p id="image-capture-description" className="mt-1 text-sm leading-5 text-slate-500">
                  Gemini lee; tú corriges y confirmas antes de guardar.
                </p>
              </div>
              <button aria-label="Cerrar" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40" disabled={pending} onClick={closeDialog} type="button">×</button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {stage === "input" ? (
                <form id="image-capture-form" onSubmit={analyze}>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="image-capture-file">
                    Elige una pizarra, apunte, captura o lista manuscrita
                  </label>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700"
                    disabled={pending}
                    id="image-capture-file"
                    onChange={chooseFile}
                    ref={inputRef}
                    required
                    type="file"
                  />
                  <p className="mt-2 text-xs text-slate-400">JPEG, PNG o WebP · máximo 5 MB · la foto original no se almacena.</p>

                  {previewUrl && file ? (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <div className="relative h-64 w-full sm:h-80">
                        <Image alt="Vista previa de la imagen seleccionada" className="object-contain" fill sizes="(max-width: 640px) 100vw, 768px" src={previewUrl} unoptimized />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0">{(file.size / 1024 / 1024).toLocaleString("es", { maximumFractionDigits: 2 })} MB</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                      <span className="text-3xl text-violet-400" aria-hidden="true">▧</span>
                      <p className="mt-3 text-sm font-semibold text-slate-700">La vista previa aparecerá aquí</p>
                      <p className="mt-1 text-xs text-slate-400">Procura buena luz, enfoque y encuadre completo.</p>
                    </div>
                  )}
                </form>
              ) : null}

              {stage === "review" ? (
                <div className="space-y-4">
                  {previewUrl ? (
                    <div className="relative h-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <Image alt="Imagen analizada" className="object-contain" fill sizes="768px" src={previewUrl} unoptimized />
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
                    <p>{feedback}</p>
                    <p className="shrink-0 font-semibold">{selected.size} de {items.length} seleccionadas</p>
                  </div>
                  {items.map((item, index) => (
                    <DraftCard
                      allowedTypes={editableTypes}
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
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">La imagen quedó organizada</h3>
                  <p className="mt-2 text-sm text-slate-500">{savedResult.message}</p>
                  <ul className="mx-auto mt-6 max-w-lg space-y-2 text-left">
                    {savedResult.saved.map((item) => (
                      <li key={item.id}>
                        <Link className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-violet-200 hover:bg-violet-50" href={item.href} onClick={closeDialog}>
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-xs text-slate-500">{typeLabels[item.itemType]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {feedback && stage === "input" ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p> : null}
              {feedback && stage === "review" && savedResult && !savedResult.ok ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p> : null}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              {stage === "input" ? (
                <>
                  <button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button>
                  <button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || !file} form="image-capture-form" type="submit">{pending ? "Leyendo imagen…" : "Analizar y revisar"}</button>
                </>
              ) : null}
              {stage === "review" ? (
                <>
                  <button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button>
                  <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700" disabled={pending} onClick={() => { setStage("input"); setFeedback(null); setSavedResult(null); }} type="button">Elegir otra imagen</button>
                  <button className="min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || selected.size === 0} onClick={save} type="button">{pending ? "Guardando…" : selected.size === items.length ? "Guardar todo" : "Guardar seleccionados"}</button>
                </>
              ) : null}
              {stage === "saved" ? <button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700" onClick={closeDialog} type="button">Cerrar</button> : null}
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
