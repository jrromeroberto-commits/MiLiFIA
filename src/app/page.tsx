import Link from "next/link";

const todayTasks = [
  { title: "Revisar avances de la tesis", meta: "Hoy · Prioridad alta" },
  { title: "Ordenar ideas para LifeOS", meta: "Hoy · LifeOS" },
  { title: "Responder a Carlos", meta: "Hoy · Personal" },
];

const projects = [
  { name: "LifeOS", progress: 18, color: "bg-violet-500" },
  { name: "Tesis", progress: 62, color: "bg-sky-500" },
  { name: "CasaBalance", progress: 34, color: "bg-amber-500" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="hero-card overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow">Miércoles, 16 de septiembre</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Buenos días. Tienes espacio para avanzar.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Captura lo que tienes en la cabeza. LifeOS lo convertirá en el
            siguiente paso claro.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
            href="/chat"
          >
            Cuéntame qué tienes en mente
          </Link>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section aria-labelledby="summary-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tu día de un vistazo</p>
            <h2 id="summary-title" className="section-title">
              Lo importante, sin ruido
            </h2>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">
            Datos demostrativos de la Fase 1
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="metric-card">
            <span className="metric-dot bg-violet-500" />
            <p className="metric-label">Para hoy</p>
            <p className="metric-value">3</p>
            <p className="metric-detail">Una tarea prioritaria</p>
          </article>
          <article className="metric-card">
            <span className="metric-dot bg-rose-400" />
            <p className="metric-label">Vencidas</p>
            <p className="metric-value">1</p>
            <p className="metric-detail">Necesita una nueva fecha</p>
          </article>
          <article className="metric-card">
            <span className="metric-dot bg-sky-500" />
            <p className="metric-label">Proyectos activos</p>
            <p className="metric-value">3</p>
            <p className="metric-detail">Dos con actividad reciente</p>
          </article>
          <article className="metric-card">
            <span className="metric-dot bg-amber-400" />
            <p className="metric-label">Ideas recientes</p>
            <p className="metric-value">4</p>
            <p className="metric-detail">Guardadas esta semana</p>
          </article>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="panel" aria-labelledby="tasks-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Enfoque</p>
              <h2 id="tasks-title" className="section-title">
                Tareas de hoy
              </h2>
            </div>
            <span className="count-pill">3 pendientes</span>
          </div>
          <div className="divide-y divide-slate-100">
            {todayTasks.map((task) => (
              <article className="flex items-start gap-4 py-4" key={task.title}>
                <span
                  className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-slate-300"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-medium text-slate-900">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{task.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="projects-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">En movimiento</p>
              <h2 id="projects-title" className="section-title">
                Proyectos
              </h2>
            </div>
            <Link className="text-link" href="/projects">
              Ver todos
            </Link>
          </div>
          <div className="space-y-5 pt-3">
            {projects.map((project) => (
              <article key={project.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <h3 className="font-medium text-slate-800">{project.name}</h3>
                  <span className="text-slate-500">{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${project.color}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
