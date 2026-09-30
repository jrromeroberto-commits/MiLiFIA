"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  deleteProjectFileAction,
  uploadProjectFileAction,
} from "@/app/actions/project-file-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";
import { formatDateTime } from "@/lib/presentation/date";

type ProjectFileItem = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  processingStatus: "READY" | "NO_TEXT";
  textTruncated: boolean;
  pageCount: number | null;
  createdAt: Date;
  _count: { chunks: number };
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ProjectFileSection({
  projectId,
  files,
}: {
  projectId: string;
  files: ProjectFileItem[];
}) {
  const [state, formAction] = useActionState(uploadProjectFileAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <section className="panel" aria-labelledby="project-files-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Documentación verificable</p>
          <h2 id="project-files-title" className="section-title">Archivos</h2>
        </div>
        <span className="count-pill">{files.length}</span>
      </div>

      <form action={formAction} className="rounded-2xl bg-emerald-50/60 p-4 sm:p-5" ref={formRef}>
        <input name="projectId" type="hidden" value={projectId} />
        <label className="field-label" htmlFor="project-file">Agregar al proyecto</label>
        <input
          accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp"
          className="field-input file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-800"
          id="project-file"
          name="file"
          required
          type="file"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          PDF, Word, TXT, JPG, PNG o WebP · máximo 8 MB. PDF, DOCX y TXT se indexan sin enviarlos a Gemini.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubmitButton label="Guardar archivo" pendingLabel="Procesando…" variant="secondary" />
          <FormFeedback state={state} />
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {files.length ? files.map((file) => (
          <article className="rounded-2xl border border-slate-100 p-4" key={file.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <a className="text-link break-all font-semibold" href={`/files/${file.id}/download`}>
                  {file.originalName}
                </a>
                <p className="mt-1 text-xs text-slate-500">
                  {fileSize(file.size)} · {formatDateTime(file.createdAt)}
                  {file.pageCount ? ` · ${file.pageCount} páginas` : ""}
                </p>
                <p className={`mt-2 text-xs font-semibold ${file.processingStatus === "READY" ? "text-emerald-700" : "text-amber-700"}`}>
                  {file.processingStatus === "READY"
                    ? `Texto indexado en ${file._count.chunks} fragmentos${file.textTruncated ? " (límite aplicado)" : ""}`
                    : "Archivo conservado sin texto indexado"}
                </p>
              </div>
              <form
                action={deleteProjectFileAction}
                onSubmit={(event) => {
                  if (!window.confirm(`¿Eliminar “${file.originalName}”?`)) event.preventDefault();
                }}
              >
                <input name="projectId" type="hidden" value={projectId} />
                <input name="fileId" type="hidden" value={file.id} />
                <button className="min-h-10 rounded-xl px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50" type="submit">
                  Eliminar
                </button>
              </form>
            </div>
          </article>
        )) : (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            Aún no hay archivos. Agrega documentación para poder encontrarla desde el chat.
          </p>
        )}
      </div>
    </section>
  );
}
