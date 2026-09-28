"use client";

import { useActionState } from "react";
import { createProjectAction } from "@/app/actions/project-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";

export function ProjectCreateForm() {
  const [state, formAction] = useActionState(createProjectAction, initialActionState);

  return (
    <form action={formAction} className="panel space-y-4">
      <div>
        <p className="eyebrow">Nuevo enfoque</p>
        <h2 className="section-title">Crear proyecto</h2>
      </div>
      <div>
        <label className="field-label" htmlFor="project-name">
          Nombre
        </label>
        <input
          className="field-input"
          id="project-name"
          name="name"
          placeholder="Ej. Terminar tesis"
          maxLength={160}
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="project-description">
          Descripción <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          className="field-input min-h-24 resize-y"
          id="project-description"
          name="description"
          placeholder="¿Qué resultado quieres conseguir?"
          maxLength={5000}
        />
      </div>
      <FormFeedback state={state} />
      <SubmitButton label="Crear proyecto" pendingLabel="Creando…" />
    </form>
  );
}
