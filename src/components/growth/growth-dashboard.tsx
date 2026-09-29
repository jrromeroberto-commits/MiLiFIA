import { completeGoalAction } from "@/app/actions/growth-actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCalendarDate } from "@/lib/presentation/date";
import type { getGrowthDashboard } from "@/services/growth-service";

type GrowthDashboardData = Awaited<ReturnType<typeof getGrowthDashboard>>;

const periodLabels = { DAILY: "día", WEEKLY: "semana" } as const;
const goalStatusLabels = {
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
} as const;

export function GrowthDashboard({ data }: { data: GrowthDashboardData }) {
  const metrics = [
    {
      label: "Hábitos activos",
      value: data.metrics.activeHabits,
      detail: "Rutinas que estás siguiendo",
      color: "bg-violet-500",
    },
    {
      label: "Registros semanales",
      value: data.metrics.weeklyLogs,
      detail: "Avances durante esta semana",
      color: "bg-sky-500",
    },
    {
      label: "Objetivos logrados",
      value: data.metrics.habitsOnTarget,
      detail: "Hábitos que alcanzaron su ritmo",
      color: "bg-emerald-500",
    },
    {
      label: "Metas activas",
      value: data.metrics.activeGoals,
      detail: "Resultados todavía en curso",
      color: "bg-amber-400",
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Crecimiento personal"
        title="Hábitos y metas"
        description="Registra avances desde el chat y observa un resumen calculado con tus datos reales de esta semana."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de crecimiento">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-dot ${metric.color}`} />
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Esta semana</p>
            <h2 className="section-title">Tus hábitos</h2>
          </div>
          <span className="count-pill">{data.habits.length} hábitos</span>
        </div>

        {data.habits.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.habits.map((habit) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5" key={habit.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{habit.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {habit.targetCount
                        ? `${habit.targetCount} ${habit.unit} por ${periodLabels[habit.period]}`
                        : `Sin objetivo · medido en ${habit.unit}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${habit.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {habit.active ? "Activo" : "Pausado"}
                  </span>
                </div>

                {habit.weeklyTarget ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{habit.progressValue} de {habit.weeklyTarget} {habit.unit}</span>
                      <span className="font-semibold text-violet-700">{habit.progressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${habit.progressPercent}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {habit.progressCount} {habit.progressCount === 1 ? "registro" : "registros"} · {habit.weeklyValue} {habit.unit} esta semana
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-400">
                  {habit.latestDate ? `Último avance: ${formatCalendarDate(habit.latestDate)}` : "Todavía sin registros esta semana"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState compact title="Aún no tienes hábitos" description="Prueba en el chat: “Quiero estudiar inglés cuatro veces por semana”." />
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Dirección</p>
            <h2 className="section-title">Tus metas</h2>
          </div>
          <span className="count-pill">{data.goals.length} metas</span>
        </div>

        {data.goals.length ? (
          <div className="space-y-3">
            {data.goals.map((goal) => (
              <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between" key={goal.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${goal.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>{goalStatusLabels[goal.status]}</span>
                  </div>
                  {goal.description ? <p className="mt-2 text-sm text-slate-500">{goal.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-400">{goal.targetDate ? `Fecha objetivo: ${formatCalendarDate(goal.targetDate)}` : "Sin fecha objetivo"}</p>
                </div>
                {goal.status === "ACTIVE" ? (
                  <form action={completeGoalAction.bind(null, goal.id)}>
                    <SubmitButton label="Marcar completada" pendingLabel="Completando…" variant="secondary" />
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState compact title="Aún no tienes metas" description="Prueba en el chat: “Mi meta es terminar LifeOS este mes”." />
        )}
      </section>
    </div>
  );
}
