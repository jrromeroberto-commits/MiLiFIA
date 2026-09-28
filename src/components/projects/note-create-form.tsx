"use client";

import { useActionState, useEffect, useRef } from "react";
import { createNoteAction } from "@/app/actions/project-item-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";

export function NoteCreateForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(createNoteAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <div>
        <label className="field-label" htmlFor="new-note-title">
          Título <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          className="field-input"
          id="new-note-title"
          name="title"
          placeholder="Referencia breve"
          maxLength={240}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="new-note-content">
          Nota
        </label>
        <textarea
          className="field-input min-h-28 resize-y"
          id="new-note-content"
          name="content"
          placeholder="Escribe lo que no quieres perder…"
          maxLength={50000}
          required
        />
      </div>
      <FormFeedback state={state} />
      <SubmitButton label="Guardar nota" pendingLabel="Guardando…" variant="secondary" />
    </form>
  );
}
