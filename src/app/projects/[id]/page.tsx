import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { ProjectActivity, type ActivityItem } from "@/components/projects/project-activity";
import { ProjectEditForm } from "@/components/projects/project-edit-form";
import {
  ProjectIdeaSection,
  ProjectNoteSection,
} from "@/components/projects/project-knowledge-sections";
import { ProjectTaskSection } from "@/components/projects/project-task-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { EntityNotFoundError } from "@/services/errors";
import { getProjectDetail } from "@/services/project-service";

export const metadata = { title: "Detalle de proyecto" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const user = await requireCurrentUser();

  let project: Awaited<ReturnType<typeof getProjectDetail>>;
  try {
    project = await getProjectDetail(user.id, id);
  } catch (error) {
    if (error instanceof EntityNotFoundError || error instanceof ZodError) notFound();
    throw error;
  }

  const openTasks = project.tasks.filter(
    (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED",
  ).length;
  const activity = buildActivity(project);

  return (
    <div className="space-y-8">
      <header>
        <Link className="text-link inline-flex min-h-10 items-center" href="/projects">
          ← Volver a proyectos
        </Link>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Proyecto</p>
              <StatusBadge status={project.status} />
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {project.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              {project.description ?? "Este proyecto todavía no tiene una descripción."}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen del proyecto">
        <ProjectMetric value={openTasks} label="Tareas abiertas" color="bg-violet-500" />
        <ProjectMetric value={project.notes.length} label="Notas" color="bg-sky-500" />
        <ProjectMetric value={project.ideas.length} label="Ideas" color="bg-amber-400" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <ProjectTaskSection projectId={project.id} tasks={project.tasks} />
        <div className="space-y-6">
          <ProjectActivity items={activity} />
          <details className="panel group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Configuración</p>
                <h2 className="section-title">Editar proyecto</h2>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <ProjectEditForm
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  status: project.status,
                }}
              />
            </div>
          </details>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <ProjectIdeaSection projectId={project.id} ideas={project.ideas} />
        <ProjectNoteSection projectId={project.id} notes={project.notes} />
      </div>
    </div>
  );
}

function ProjectMetric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <article className="metric-card flex items-center gap-4">
      <span className={`size-3 rounded-full ${color}`} />
      <div>
        <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </article>
  );
}

function buildActivity(
  project: Awaited<ReturnType<typeof getProjectDetail>>,
): ActivityItem[] {
  return [
    {
      id: `project-${project.id}`,
      title: "Proyecto creado",
      detail: project.name,
      at: project.createdAt,
      color: "bg-violet-500",
    },
    ...project.tasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.completedAt ? "Tarea completada" : "Tarea agregada",
      detail: task.title,
      at: task.completedAt ?? task.createdAt,
      color: "bg-emerald-500",
    })),
    ...project.ideas.map((idea) => ({
      id: `idea-${idea.id}`,
      title: "Idea guardada",
      detail: idea.title,
      at: idea.createdAt,
      color: "bg-amber-400",
    })),
    ...project.notes.map((note) => ({
      id: `note-${note.id}`,
      title: "Nota guardada",
      detail: note.title ?? "Nota sin título",
      at: note.createdAt,
      color: "bg-sky-500",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);
}
