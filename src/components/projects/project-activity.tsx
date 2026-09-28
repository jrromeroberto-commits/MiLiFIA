import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/presentation/date";

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  at: Date;
  color: string;
};

export function ProjectActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="panel" aria-labelledby="project-activity-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Historia reciente</p>
          <h2 id="project-activity-title" className="section-title">Actividad</h2>
        </div>
      </div>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item) => (
            <li className="flex gap-3" key={item.id}>
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.color}`} aria-hidden="true" />
              <div>
                <h3 className="text-sm font-medium text-slate-800">{item.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                <time className="mt-1 block text-xs text-slate-400" dateTime={item.at.toISOString()}>
                  {formatDateTime(item.at)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState compact title="Sin actividad" description="Los movimientos recientes del proyecto aparecerán aquí." />
      )}
      <p className="mt-5 text-xs leading-5 text-slate-400">
        Esta vista se deriva de las fechas actuales. Una bitácora histórica completa llegará en la Fase 14.
      </p>
    </section>
  );
}
