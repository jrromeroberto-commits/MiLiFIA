"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTaskAction } from "@/app/actions/project-item-actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialActionState } from "@/lib/forms/action-state";

export function TaskCreateForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(createTaskAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <div>
        <label className="field-label" htmlFor="new-task-title">
          Tarea
        </label>
        <input
          className="field-input"
          id="new-task-title"
          name="title"
          placeholder="Siguiente acción concreta"
          maxLength={240}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="new-task-date">
            Fecha
          </label>
          <input className="field-input" id="new-task-date" name="dueDate" type="date" />
        </div>
        <div>
          <label className="field-label" htmlFor="new-task-priority">
            Prioridad
          </label>
          <select className="field-input" defaultValue="MEDIUM" id="new-task-priority" name="priority">
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
          </select>
        </div>
      </div>
      <FormFeedback state={state} />
      <SubmitButton label="Agregar tarea" pendingLabel="Agregando…" variant="secondary" />
    </form>
  );
}
