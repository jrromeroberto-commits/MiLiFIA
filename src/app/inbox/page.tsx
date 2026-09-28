import { connection } from "next/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDateTime } from "@/lib/presentation/date";
import { listInboxItems } from "@/services/inbox-service";

export const metadata = { title: "Inbox" };

const typeLabels: Record<string, string> = {
  TASK: "Tarea",
  PROJECT: "Proyecto",
  IDEA: "Idea",
  NOTE: "Nota",
  UNKNOWN: "Sin clasificar",
};

export default async function InboxPage() {
  await connection();
  const user = await requireCurrentUser();
  const items = await listInboxItems(user.id);
  const pending = items.filter((item) => !item.processed).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Captura sin fricción"
        title="Inbox"
        description="Aquí aparecerán los pensamientos que todavía necesiten clasificación o confirmación."
        action={<span className="count-pill self-start sm:self-auto">{pending} pendientes</span>}
      />

      <section className="panel" aria-labelledby="inbox-list-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Entrada reciente</p>
            <h2 id="inbox-list-title" className="section-title">Elementos capturados</h2>
          </div>
        </div>

        {items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <article className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-start" key={item.id}>
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.originalText}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      {typeLabels[item.detectedType ?? "UNKNOWN"]}
                    </span>
                    <time dateTime={item.createdAt.toISOString()}>{formatDateTime(item.createdAt)}</time>
                  </div>
                </div>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.processed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.processed ? "Procesado" : "Pendiente"}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tu Inbox está limpio"
            description="Los mensajes capturados desde el chat y el Brain Dump aparecerán aquí en fases posteriores."
          />
        )}
      </section>
    </div>
  );
}
