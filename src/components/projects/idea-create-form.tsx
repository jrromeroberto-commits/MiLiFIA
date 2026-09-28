"use client";

import { useActionState, useEffect, useRef } from "react";
import { createIdeaAction } from "@/app/actions/project-item-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";

export function IdeaCreateForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(createIdeaAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <div>
        <label className="field-label" htmlFor="new-idea-title">
          Idea
        </label>
        <input
          className="field-input"
          id="new-idea-title"
          name="title"
          placeholder="¿Qué se te ocurrió?"
          maxLength={240}
          required
        />
      </div>
      <input name="status" type="hidden" value="NEW" />
      <div>
        <label className="field-label" htmlFor="new-idea-description">
          Contexto <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          className="field-input min-h-20 resize-y"
          id="new-idea-description"
          name="description"
          placeholder="Una frase para recordarla después"
          maxLength={5000}
        />
      </div>
      <FormFeedback state={state} />
      <SubmitButton label="Guardar idea" pendingLabel="Guardando…" variant="secondary" />
    </form>
  );
}
