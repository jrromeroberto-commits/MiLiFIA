import { completeTaskAction } from "@/app/actions/project-item-actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { TaskCreateForm } from "@/components/projects/task-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCalendarDate } from "@/lib/presentation/date";

type ProjectTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
};

export function ProjectTaskSection({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: ProjectTask[];
}) {
  return (
    <section className="panel" aria-labelledby="project-tasks-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Acción</p>
          <h2 id="project-tasks-title" className="section-title">Tareas</h2>
        </div>
        <span className="count-pill">{tasks.length}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl bg-violet-50/60 p-4 sm:p-5">
          <TaskCreateForm projectId={projectId} />
        </div>
        {tasks.length ? (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <article className="py-4 first:pt-0" key={task.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className={`font-medium ${task.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {task.title}
                    </h3>
                    {task.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-slate-400">Prioridad {priorityLabel(task.priority)}</span>
                      <span className="text-xs text-slate-400">
                        {task.dueDate ? formatCalendarDate(task.dueDate) : "Sin fecha"}
                      </span>
                    </div>
                  </div>
                  {task.status !== "COMPLETED" && task.status !== "CANCELLED" ? (
                    <form action={completeTaskAction} className="shrink-0">
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="taskId" type="hidden" value={task.id} />
                      <SubmitButton label="Completar" pendingLabel="Guardando…" variant="quiet" />
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState compact title="Sin tareas todavía" description="Agrega el siguiente paso concreto para mover este proyecto." />
        )}
      </div>
    </section>
  );
}

function priorityLabel(priority: string) {
  return { LOW: "baja", MEDIUM: "media", HIGH: "alta" }[priority] ?? priority;
}
