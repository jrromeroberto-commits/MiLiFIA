import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  formatCalendarDate,
  formatLongDate,
  greetingFor,
} from "@/lib/presentation/date";
import { getDashboardData } from "@/services/dashboard-service";

export default async function HomePage() {
  await connection();
  const user = await requireCurrentUser();
  const dashboard = await getDashboardData(user.id);
  const now = new Date();

  return (
    <div className="space-y-8">
      <section className="hero-card overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow capitalize">{formatLongDate(now)}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {greetingFor(now)}. Tienes espacio para avanzar.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Hoy hay {dashboard.todayTasks.length} tareas en tu foco y {dashboard.pendingCount} pendientes en total.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
            href="/projects"
          >
            Organizar mis proyectos
          </Link>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section aria-labelledby="summary-title">
        <div className="mb-4">
          <p className="eyebrow">Tu día de un vistazo</p>
          <h2 id="summary-title" className="section-title">
            Datos reales, sin ruido
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard color="bg-violet-500" label="Para hoy" value={dashboard.todayTasks.length} detail="Tareas con fecha de hoy" />
          <MetricCard color="bg-rose-400" label="Vencidas" value={dashboard.overdueCount} detail="Pendientes por reprogramar" />
          <MetricCard color="bg-sky-500" label="Proyectos activos" value={dashboard.activeProjects.length} detail="Áreas en movimiento" />
          <MetricCard color="bg-amber-400" label="Ideas recientes" value={dashboard.recentIdeas.length} detail="Últimas ideas guardadas" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel" aria-labelledby="today-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Enfoque</p>
              <h2 id="today-title" className="section-title">Tareas de hoy</h2>
            </div>
            <span className="count-pill">{dashboard.todayTasks.length} tareas</span>
          </div>
          {dashboard.todayTasks.length ? (
            <div className="divide-y divide-slate-100">
              {dashboard.todayTasks.map((task) => (
                <article className="flex items-start gap-4 py-4" key={task.id}>
                  <span className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-violet-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slate-900">{task.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-slate-400">Prioridad {priorityLabel(task.priority)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Tu día está despejado" description="Las tareas con fecha de hoy aparecerán aquí." />
          )}
        </section>

        <section className="panel" aria-labelledby="projects-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">En movimiento</p>
              <h2 id="projects-title" className="section-title">Proyectos activos</h2>
            </div>
            <Link className="text-link" href="/projects">Ver todos</Link>
          </div>
          {dashboard.activeProjects.length ? (
            <div className="space-y-3 pt-2">
              {dashboard.activeProjects.slice(0, 4).map((project) => (
                <Link
                  className="block rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-violet-200 hover:bg-violet-50/50"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">{project.name}</h3>
                    <span className="text-xs text-slate-400">{project._count.tasks} tareas</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                    {project.description ?? "Sin descripción todavía."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title="Crea tu primer proyecto"
              description="Agrupa tareas, notas e ideas alrededor de un resultado."
              action={<Link className="text-link" href="/projects">Empezar ahora</Link>}
            />
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel" aria-labelledby="pending-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Próximos pasos</p>
              <h2 id="pending-title" className="section-title">Pendientes</h2>
            </div>
          </div>
          {dashboard.pendingTasks.length ? (
            <ul className="divide-y divide-slate-100">
              {dashboard.pendingTasks.map((task) => (
                <li className="flex items-center justify-between gap-4 py-3" key={task.id}>
                  <span className="truncate text-sm font-medium text-slate-700">{task.title}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {task.dueDate ? formatCalendarDate(task.dueDate) : "Sin fecha"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title="Nada pendiente" description="Cuando agregues tareas, sus próximos pasos aparecerán aquí." />
          )}
        </section>

        <section className="panel" aria-labelledby="ideas-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Chispas recientes</p>
              <h2 id="ideas-title" className="section-title">Últimas ideas</h2>
            </div>
          </div>
          {dashboard.recentIdeas.length ? (
            <ul className="space-y-3 pt-1">
              {dashboard.recentIdeas.map((idea) => (
                <li className="rounded-2xl bg-amber-50/60 p-4" key={idea.id}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{idea.title}</span>
                    <StatusBadge status={idea.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title="Las ideas tienen lugar" description="Guárdalas dentro de un proyecto para verlas aquí." />
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ color, label, value, detail }: { color: string; label: string; value: number; detail: string }) {
  return (
    <article className="metric-card">
      <span className={`metric-dot ${color}`} />
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function priorityLabel(priority: string) {
  return { LOW: "baja", MEDIUM: "media", HIGH: "alta" }[priority] ?? priority;
}
