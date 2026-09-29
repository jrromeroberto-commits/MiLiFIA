"use client";

import Link from "next/link";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { analyzeAudioCaptureAction } from "@/app/actions/audio-capture-actions";
import {
  saveBrainDumpAction,
  type BrainDumpSaveResponse,
} from "@/app/actions/brain-dump-actions";
import { DraftCard } from "@/components/chat/brain-dump-dialog";
import { useAudioRecorder } from "@/components/chat/use-audio-recorder";
import {
  MAX_AUDIO_RECORDING_SECONDS,
  MAX_AUDIO_UPLOAD_BYTES,
} from "@/lib/validation/audio-capture";
import type { BrainDumpDraft } from "@/lib/validation/brain-dump";

type Stage = "input" | "review" | "saved";

const acceptedMimeTypes = [
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
];
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

function baseMimeType(value: string) {
  return value.toLowerCase().split(";", 1)[0].trim();
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioCaptureDialog() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("input");
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<BrainDumpDraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<BrainDumpSaveResponse | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptAudio = useCallback((nextFile: File) => {
    setFeedback(null);
    setItems([]);
    setSelected(new Set());
    setSavedResult(null);
    setTranscript("");

    if (!acceptedMimeTypes.includes(baseMimeType(nextFile.type))) {
      setFile(null);
      setAudioUrl(null);
      setFeedback("Usa un audio WebM, WAV, MP3, M4A u OGG.");
      return false;
    }
    if (nextFile.size > MAX_AUDIO_UPLOAD_BYTES) {
      setFile(null);
      setAudioUrl(null);
      setFeedback("El audio supera el límite de 10 MB.");
      return false;
    }

    setFile(nextFile);
    setAudioUrl(URL.createObjectURL(nextFile));
    return true;
  }, []);

  const recorder = useAudioRecorder({
    onComplete: acceptAudio,
    onError: setFeedback,
  });

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
    setAudioUrl(null);
    setTranscript("");
    setItems([]);
    setSelected(new Set());
    setFeedback(null);
    setSavedResult(null);
  }

  function closeDialog() {
    if (pending) return;
    if (recorder.recording) recorder.cancelRecording();
    setOpen(false);
    resetDialog();
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!acceptAudio(nextFile)) event.target.value = "";
  }

  function analyze() {
    if (!file || pending || recorder.recording) return;
    setPending(true);
    setFeedback(null);
    const formData = new FormData();
    formData.set("audio", file);

    startTransition(async () => {
      try {
        const result = await analyzeAudioCaptureAction(formData);
        setFeedback(result.message);
        if (result.ok) {
          setTranscript(result.transcript);
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
        <span className="mr-2 text-base" aria-hidden="true">●</span>
        Capturar audio
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <section
            aria-busy={pending}
            aria-describedby="audio-capture-description"
            aria-labelledby="audio-capture-title"
            aria-modal="true"
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-[1.75rem]"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="eyebrow">Captura por voz</p>
                <h2 id="audio-capture-title" className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">Organizar desde un audio</h2>
                <p id="audio-capture-description" className="mt-1 text-sm leading-5 text-slate-500">Gemini transcribe; tú corriges y confirmas antes de guardar.</p>
              </div>
              <button aria-label="Cerrar" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40" disabled={pending} onClick={closeDialog} type="button">×</button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {stage === "input" ? (
                <div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center">
                    {recorder.recording ? (
                      <>
                        <span className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-rose-100 text-2xl text-rose-600" aria-hidden="true">●</span>
                        <p className="mt-4 text-lg font-semibold text-slate-900">Grabando… {formatDuration(recorder.elapsedSeconds)}</p>
                        <p className="mt-1 text-xs text-slate-500">Máximo {MAX_AUDIO_RECORDING_SECONDS / 60} minutos. Habla con claridad y separa tus ideas.</p>
                        <button className="mt-5 min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700" onClick={recorder.stopRecording} type="button">Detener grabación</button>
                      </>
                    ) : (
                      <>
                        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700" aria-hidden="true">●</span>
                        <p className="mt-4 text-base font-semibold text-slate-900">Graba lo que tienes en mente</p>
                        <p className="mt-1 text-xs text-slate-500">Ejemplo: “Mañana revisar la tesis, terminar LifeOS y comprar un regalo”.</p>
                        <button className="mt-5 min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!recorder.supported || pending} onClick={() => { setFeedback(null); void recorder.startRecording(); }} type="button">Usar micrófono</button>
                      </>
                    )}
                  </div>

                  <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />o sube un archivo<span className="h-px flex-1 bg-slate-200" /></div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="audio-capture-file">Selecciona un audio</label>
                  <input
                    accept="audio/webm,audio/wav,audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.wav,.webm,.ogg"
                    className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700"
                    disabled={pending || recorder.recording}
                    id="audio-capture-file"
                    onChange={chooseFile}
                    ref={inputRef}
                    type="file"
                  />
                  <p className="mt-2 text-xs text-slate-400">WebM, WAV, MP3, M4A u OGG · máximo 10 MB · el audio original no se almacena.</p>

                  {audioUrl && file ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <audio className="w-full" controls preload="metadata" src={audioUrl}>Tu navegador no puede reproducir este audio.</audio>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500"><span className="truncate">{file.name}</span><span className="shrink-0">{(file.size / 1024 / 1024).toLocaleString("es", { maximumFractionDigits: 2 })} MB</span></div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {stage === "review" ? (
                <div className="space-y-4">
                  {audioUrl ? <audio className="w-full" controls preload="metadata" src={audioUrl}>Tu navegador no puede reproducir este audio.</audio> : null}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Transcripción</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{transcript}</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between"><p>{feedback}</p><p className="shrink-0 font-semibold">{selected.size} de {items.length} seleccionadas</p></div>
                  {items.map((item, index) => (
                    <DraftCard allowedTypes={editableTypes} item={item} index={index} key={item.id} onChange={(change) => updateItem(item.id, change)} onToggle={() => toggleSelected(item.id)} selected={selected.has(item.id)} />
                  ))}
                </div>
              ) : null}

              {stage === "saved" && savedResult?.ok ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">✓</span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">Tu audio quedó organizado</h3>
                  <p className="mt-2 text-sm text-slate-500">{savedResult.message}</p>
                  <ul className="mx-auto mt-6 max-w-lg space-y-2 text-left">
                    {savedResult.saved.map((item) => <li key={item.id}><Link className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-violet-200 hover:bg-violet-50" href={item.href} onClick={closeDialog}><span className="font-semibold text-slate-800">{item.label}</span><span className="text-xs text-slate-500">{typeLabels[item.itemType]}</span></Link></li>)}
                  </ul>
                </div>
              ) : null}

              {feedback && stage === "input" ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p> : null}
              {feedback && stage === "review" && savedResult && !savedResult.ok ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{feedback}</p> : null}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              {stage === "input" ? <><button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button><button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || !file || recorder.recording} onClick={analyze} type="button">{pending ? "Transcribiendo…" : "Transcribir y revisar"}</button></> : null}
              {stage === "review" ? <><button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button">Cancelar</button><button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700" disabled={pending} onClick={() => { setStage("input"); setFeedback(null); setSavedResult(null); }} type="button">Elegir otro audio</button><button className="min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={pending || selected.size === 0} onClick={save} type="button">{pending ? "Guardando…" : selected.size === items.length ? "Guardar todo" : "Guardar seleccionados"}</button></> : null}
              {stage === "saved" ? <button className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-700" onClick={closeDialog} type="button">Cerrar</button> : null}
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
