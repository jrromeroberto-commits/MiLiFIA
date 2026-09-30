import Link from "next/link";
import { connection } from "next/server";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listProjects } from "@/services/project-service";

export const metadata = { title: "Proyectos" };

export default async function ProjectsPage() {
  await connection();
  const user = await requireCurrentUser();
  const projects = await listProjects(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Áreas de enfoque"
        title="Proyectos"
        description="Convierte objetivos grandes en un lugar claro para reunir tareas, notas e ideas."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <ProjectCreateForm />

        <section className="panel" aria-labelledby="project-list-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Tu mapa</p>
              <h2 id="project-list-title" className="section-title">
                {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"}
              </h2>
            </div>
          </div>

          {projects.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/5"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-violet-50 font-semibold text-violet-700 transition group-hover:bg-violet-100">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    {project.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {project.description ?? "Añade una descripción para recordar el resultado que buscas."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{project._count.tasks} tareas</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{project._count.notes} notas</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{project._count.ideas} ideas</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{project._count.files} archivos</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aún no tienes proyectos"
              description="Usa el formulario para crear el primero. Después podrás reunir allí todo lo relacionado."
            />
          )}
        </section>
      </div>
    </div>
  );
}
