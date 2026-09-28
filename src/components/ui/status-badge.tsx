const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  PAUSED: "bg-amber-50 text-amber-700 ring-amber-600/10",
  COMPLETED: "bg-sky-50 text-sky-700 ring-sky-600/10",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-500/10",
  TODO: "bg-slate-100 text-slate-600 ring-slate-500/10",
  IN_PROGRESS: "bg-violet-50 text-violet-700 ring-violet-600/10",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-600/10",
  NEW: "bg-violet-50 text-violet-700 ring-violet-600/10",
  EXPLORING: "bg-amber-50 text-amber-700 ring-amber-600/10",
  SAVED: "bg-sky-50 text-sky-700 ring-sky-600/10",
  DISCARDED: "bg-slate-100 text-slate-600 ring-slate-500/10",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "En pausa",
  COMPLETED: "Completado",
  ARCHIVED: "Archivado",
  TODO: "Pendiente",
  IN_PROGRESS: "En progreso",
  CANCELLED: "Cancelado",
  NEW: "Nueva",
  EXPLORING: "Explorando",
  SAVED: "Guardada",
  DISCARDED: "Descartada",
  CONVERTED: "Convertida",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ring-inset ${
        statusStyles[status] ?? statusStyles.ARCHIVED
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
