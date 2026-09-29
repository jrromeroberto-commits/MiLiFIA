import Link from "next/link";
import { ReviewNarrative } from "@/components/review/review-narrative";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type {
  ReviewItem,
  ReviewKind,
  ReviewReport,
} from "@/services/review-service";

export function ReviewDashboard({ report }: { report: ReviewReport }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={report.periodLabel}
        title={report.title}
        description={report.description}
        action={<ReviewPeriodSwitcher current={report.kind} />}
      />

      <section aria-labelledby="review-metrics-title">
        <div className="mb-4">
          <p className="eyebrow">Métricas verificadas</p>
          <h2 id="review-metrics-title" className="section-title">El período de un vistazo</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {report.metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span className={`metric-dot ${metric.color}`} />
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-detail">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <ReviewNarrative kind={report.kind} />

      <section className="grid items-start gap-6 xl:grid-cols-2" aria-label="Detalle de la revisión">
        {report.sections.map((section) => (
          <article className="panel" key={section.id} aria-labelledby={`review-${section.id}`}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{section.eyebrow}</p>
                <h2 className="section-title" id={`review-${section.id}`}>{section.title}</h2>
              </div>
              <span className="count-pill">{section.total}</span>
            </div>

            {section.items.length ? (
              <ul className="divide-y divide-slate-100">
                {section.items.map((item) => <ReviewListItem item={item} key={item.id} />)}
              </ul>
            ) : (
              <EmptyState compact title={section.emptyTitle} description={section.emptyDescription} />
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function ReviewPeriodSwitcher({ current }: { current: ReviewKind }) {
  return (
    <nav className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Período de revisión">
      <PeriodLink active={current === "daily"} href="/review/daily">Diaria</PeriodLink>
      <PeriodLink active={current === "weekly"} href="/review/weekly">Semanal</PeriodLink>
    </nav>
  );
}

function PeriodLink({ active, href, children }: { active: boolean; href: string; children: string }) {
  return (
    <Link className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-violet-100 text-violet-800" : "text-slate-500 hover:text-slate-900"}`} href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function ReviewListItem({ item }: { item: ReviewItem }) {
  return (
    <li>
      <Link className="group flex items-start justify-between gap-4 py-4" href={item.href}>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-violet-700">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
        </div>
        {item.badge ? <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">{item.badge}</span> : null}
      </Link>
    </li>
  );
}
