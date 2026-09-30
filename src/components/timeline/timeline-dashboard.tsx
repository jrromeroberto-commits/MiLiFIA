import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type {
  PersonalTimeline,
  TimelineEvent,
  TimelineEventKind,
} from "@/services/timeline-service";

const eventStyles: Record<
  TimelineEventKind,
  { label: string; symbol: string; color: string; surface: string }
> = {
  PROJECT_CREATED: { label: "Proyecto", symbol: "P", color: "bg-violet-500", surface: "bg-violet-50 text-violet-700" },
  TASK_CREATED: { label: "Tarea", symbol: "T", color: "bg-slate-400", surface: "bg-slate-100 text-slate-600" },
  TASK_COMPLETED: { label: "Completada", symbol: "✓", color: "bg-emerald-500", surface: "bg-emerald-50 text-emerald-700" },
  IDEA_CREATED: { label: "Idea", symbol: "I", color: "bg-amber-400", surface: "bg-amber-50 text-amber-700" },
  NOTE_CREATED: { label: "Nota", symbol: "N", color: "bg-sky-500", surface: "bg-sky-50 text-sky-700" },
  EXPENSE_RECORDED: { label: "Gasto", symbol: "S/", color: "bg-rose-400", surface: "bg-rose-50 text-rose-700" },
  HABIT_CREATED: { label: "Hábito", symbol: "H", color: "bg-cyan-500", surface: "bg-cyan-50 text-cyan-700" },
  HABIT_LOGGED: { label: "Avance", symbol: "+", color: "bg-teal-500", surface: "bg-teal-50 text-teal-700" },
  GOAL_CREATED: { label: "Meta", symbol: "M", color: "bg-fuchsia-400", surface: "bg-fuchsia-50 text-fuchsia-700" },
  GOAL_COMPLETED: { label: "Meta lograda", symbol: "★", color: "bg-lime-500", surface: "bg-lime-50 text-lime-700" },
  FILE_ADDED: { label: "Archivo", symbol: "A", color: "bg-indigo-400", surface: "bg-indigo-50 text-indigo-700" },
};

function timelineHref(period: PersonalTimeline["period"], date: string) {
  return `/timeline?period=${period}&date=${date}`;
}

function eventTime(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TimelineDashboard({ timeline }: { timeline: PersonalTimeline }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={timeline.periodLabel}
        title="Tu línea de tiempo"
        description="Un registro cronológico construido con las fechas reales de tus proyectos, tareas, ideas, gastos, hábitos, metas y archivos."
        action={<PeriodSwitcher timeline={timeline} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de actividad">
        <TimelineMetric label="Eventos" value={timeline.metrics.totalEvents} color="bg-violet-500" />
        <TimelineMetric label="Tareas terminadas" value={timeline.metrics.completedTasks} color="bg-emerald-500" />
        <TimelineMetric label="Proyectos relacionados" value={timeline.metrics.activeProjects} color="bg-sky-500" />
        <TimelineMetric label="Capturas" value={timeline.metrics.capturedItems} color="bg-amber-400" />
      </section>

      <section className="panel" aria-labelledby="timeline-events-title">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Actividad {timeline.period === "daily" ? "diaria" : "semanal"}</p>
            <h2 className="section-title" id="timeline-events-title">Momentos registrados</h2>
          </div>
          <DateControls timeline={timeline} />
        </div>

        {timeline.groups.length ? (
          <div className="mt-6 space-y-9">
            {timeline.groups.map((group) => (
              <section key={group.dateKey} aria-labelledby={`timeline-${group.dateKey}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="capitalize text-sm font-semibold text-slate-800" id={`timeline-${group.dateKey}`}>
                    {group.label}
                  </h3>
                  <span className="count-pill">{group.events.length}</span>
                </div>
                <ol className="relative ml-4 border-l border-slate-200 pl-7 sm:ml-16 sm:pl-9">
                  {group.events.map((event) => (
                    <TimelineRow event={event} key={event.id} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Sin actividad en este período"
              description="Cuando crees, completes o registres algo en LifeOS, aparecerá aquí con su hora real."
            />
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-400">
        La timeline se deriva de registros existentes. Si eliminas una entidad, su evento también desaparece; una auditoría inmutable requeriría un historial dedicado.
      </p>
    </div>
  );
}

function PeriodSwitcher({ timeline }: { timeline: PersonalTimeline }) {
  return (
    <nav className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Período de la línea de tiempo">
      <PeriodLink active={timeline.period === "daily"} href={timelineHref("daily", timeline.selectedDate)}>
        Día
      </PeriodLink>
      <PeriodLink active={timeline.period === "weekly"} href={timelineHref("weekly", timeline.selectedDate)}>
        Semana
      </PeriodLink>
    </nav>
  );
}

function PeriodLink({ active, href, children }: { active: boolean; href: string; children: string }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-violet-100 text-violet-800" : "text-slate-500 hover:text-slate-900"}`}
      href={href}
    >
      {children}
    </Link>
  );
}

function DateControls({ timeline }: { timeline: PersonalTimeline }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        aria-label="Período anterior"
        className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:text-violet-700"
        href={timelineHref(timeline.period, timeline.previousDate)}
      >
        ←
      </Link>
      <form action="/timeline" className="flex items-center gap-2" method="get">
        <input name="period" type="hidden" value={timeline.period} />
        <label className="sr-only" htmlFor="timeline-date">Fecha de referencia</label>
        <input
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          defaultValue={timeline.selectedDate}
          id="timeline-date"
          name="date"
          required
          type="date"
        />
        <button className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-100 hover:text-violet-800" type="submit">
          Ver
        </button>
      </form>
      <Link
        aria-label="Período siguiente"
        className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:text-violet-700"
        href={timelineHref(timeline.period, timeline.nextDate)}
      >
        →
      </Link>
    </div>
  );
}

function TimelineMetric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <article className="metric-card flex items-center gap-4">
      <span className={`size-3 rounded-full ${color}`} aria-hidden="true" />
      <div>
        <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </article>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const style = eventStyles[event.kind];
  const content = (
    <article className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-violet-100 hover:shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${style.surface}`} aria-hidden="true">
          {style.symbol}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800 transition group-hover:text-violet-700">{event.title}</h4>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-500">{style.label}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{event.detail}</p>
        </div>
      </div>
    </article>
  );

  return (
    <li className="relative pb-5 last:pb-0">
      <span className={`absolute -left-[2.1rem] top-5 size-2.5 rounded-full ring-4 ring-white sm:-left-[2.6rem] ${style.color}`} aria-hidden="true" />
      <time className="mb-2 block text-xs font-semibold text-slate-400 sm:absolute sm:-left-[6.75rem] sm:top-4 sm:mb-0 sm:w-14 sm:text-right" dateTime={event.at.toISOString()}>
        {eventTime(event.at)}
      </time>
      {event.href.startsWith("/files/") ? <a href={event.href}>{content}</a> : <Link href={event.href}>{content}</Link>}
    </li>
  );
}
