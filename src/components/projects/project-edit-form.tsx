"use client";

import { useActionState } from "react";
import { updateProjectAction } from "@/app/actions/project-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";

type ProjectEditFormProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
  };
};

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const [state, formAction] = useActionState(updateProjectAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="projectId" type="hidden" value={project.id} />
      <div>
        <label className="field-label" htmlFor="edit-project-name">
          Nombre
        </label>
        <input
          className="field-input"
          defaultValue={project.name}
          id="edit-project-name"
          name="name"
          maxLength={160}
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="edit-project-description">
          Descripción
        </label>
        <textarea
          className="field-input min-h-24 resize-y"
          defaultValue={project.description ?? ""}
          id="edit-project-description"
          name="description"
          maxLength={5000}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="edit-project-status">
          Estado
        </label>
        <select
          className="field-input"
          defaultValue={project.status}
          id="edit-project-status"
          name="status"
        >
          <option value="ACTIVE">Activo</option>
          <option value="PAUSED">En pausa</option>
          <option value="COMPLETED">Completado</option>
          <option value="ARCHIVED">Archivado</option>
        </select>
      </div>
      <FormFeedback state={state} />
      <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
    </form>
  );
}
