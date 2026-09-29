import "server-only";

import { reviewRepository } from "@/lib/db/repositories/review-repository";
import { formatCalendarDate, formatDateTime } from "@/lib/presentation/date";
import {
  calendarDateUtc,
  localDateKey,
  localDateRangeUtc,
  localDateStartUtc,
  weekRange,
} from "@/lib/time/calendar";
import { entityIdSchema } from "@/lib/validation/common";

export type ReviewKind = "daily" | "weekly";

export type ReviewMetric = {
  label: string;
  value: number;
  detail: string;
  color: string;
};

export type ReviewItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  badge?: string;
};

export type ReviewSection = {
  id: string;
  eyebrow: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  total: number;
  items: ReviewItem[];
};

export type ReviewReport = {
  kind: ReviewKind;
  periodLabel: string;
  title: string;
  description: string;
  metrics: ReviewMetric[];
  sections: ReviewSection[];
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const priorityLabels = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" } as const;

function periodLabel(kind: ReviewKind, start: Date, end: Date) {
  if (kind === "daily") {
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(start);
  }

  const formatter = new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

function taskDetail(task: {
  dueDate: Date | null;
  priority: keyof typeof priorityLabels;
}) {
  return `${task.dueDate ? formatCalendarDate(task.dueDate) : "Sin fecha"} · Prioridad ${priorityLabels[task.priority].toLocaleLowerCase("es")}`;
}

export async function getReviewReport(
  userId: string,
  kind: ReviewKind,
  referenceDate = new Date(),
): Promise<ReviewReport> {
  const ownerId = entityIdSchema.parse(userId);
  const todayKey = localDateKey(referenceDate);
  const keys = kind === "daily" ? { start: todayKey, end: todayKey } : weekRange(todayKey);
  const range = localDateRangeUtc(keys.start, keys.end);
  const today = calendarDateUtc(todayKey);
  const snapshot = await reviewRepository.snapshot(ownerId, {
    ...range,
    today,
  });
  const projectNames = new Map(
    snapshot.projects.map((project) => [project.id, project.name]),
  );
  const activity = snapshot.projects
    .map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      count:
        project.tasks.length +
        project.ideas.length +
        project.notes.length +
        (project.updatedAt >= range.start && project.updatedAt < range.endExclusive
          ? 1
          : 0),
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  const workedProjects = activity.filter((project) => project.count > 0);
  const inactiveProjects = activity.filter(
    (project) => project.status === "ACTIVE" && project.count === 0,
  );
  const importantPending = snapshot.pendingTasks
    .filter((task) => task.priority === "HIGH")
    .sort(
      (left, right) =>
        priorityOrder[left.priority] - priorityOrder[right.priority] ||
        (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );
  const sortedPending = [...snapshot.pendingTasks].sort(
    (left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority] ||
      (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
  );

  const completedItems = snapshot.completedTasks.slice(0, 8).map((task) => ({
    id: task.id,
    title: task.title,
    detail: task.completedAt
      ? `Completada ${formatDateTime(task.completedAt)}`
      : "Completada",
    href: task.projectId ? `/projects/${task.projectId}` : "/",
    badge: "Hecha",
  }));
  const ideaItems = snapshot.newIdeas.slice(0, 8).map((idea) => ({
    id: idea.id,
    title: idea.title,
    detail: `${formatDateTime(idea.createdAt)} · ${idea.projectId ? (projectNames.get(idea.projectId) ?? "Proyecto") : "Idea independiente"}`,
    href: idea.projectId ? `/projects/${idea.projectId}` : "/",
    badge: "Nueva",
  }));

  if (kind === "daily") {
    return {
      kind,
      periodLabel: periodLabel(kind, referenceDate, referenceDate),
      title: "Revisión diaria",
      description:
        "Cierra el día con una lectura clara de lo completado, lo pendiente y lo que necesita atención.",
      metrics: [
        {
          label: "Completadas",
          value: snapshot.completedTasks.length,
          detail: "Tareas terminadas hoy",
          color: "bg-emerald-500",
        },
        {
          label: "Pendientes",
          value: snapshot.pendingTasks.length,
          detail: "Tareas todavía abiertas",
          color: "bg-violet-500",
        },
        {
          label: "Proyectos trabajados",
          value: workedProjects.length,
          detail: "Con actividad registrada hoy",
          color: "bg-sky-500",
        },
        {
          label: "Ideas nuevas",
          value: snapshot.newIdeas.length,
          detail: "Ideas capturadas hoy",
          color: "bg-amber-400",
        },
        {
          label: "Vencidas",
          value: snapshot.overdueTasks.length,
          detail: "Pendientes anteriores a hoy",
          color: "bg-rose-500",
        },
      ],
      sections: [
        {
          id: "completed",
          eyebrow: "Progreso",
          title: "Tareas completadas",
          emptyTitle: "Aún no hay tareas completadas",
          emptyDescription: "Cuando cierres una tarea hoy, aparecerá en este balance.",
          total: snapshot.completedTasks.length,
          items: completedItems,
        },
        {
          id: "pending",
          eyebrow: "Siguiente foco",
          title: "Pendientes",
          emptyTitle: "No quedan tareas pendientes",
          emptyDescription: "Tu lista está despejada por ahora.",
          total: snapshot.pendingTasks.length,
          items: sortedPending.slice(0, 8).map((task) => ({
            id: task.id,
            title: task.title,
            detail: taskDetail(task),
            href: task.projectId ? `/projects/${task.projectId}` : "/",
            badge: priorityLabels[task.priority],
          })),
        },
        {
          id: "worked-projects",
          eyebrow: "Movimiento",
          title: "Proyectos trabajados",
          emptyTitle: "Sin actividad de proyectos hoy",
          emptyDescription: "Crear o actualizar tareas, ideas o notas contará como avance.",
          total: workedProjects.length,
          items: workedProjects.slice(0, 8).map((project) => ({
            id: project.id,
            title: project.name,
            detail: `${project.count} ${project.count === 1 ? "actividad" : "actividades"} registrada${project.count === 1 ? "" : "s"}`,
            href: `/projects/${project.id}`,
            badge: "Activo",
          })),
        },
        {
          id: "new-ideas",
          eyebrow: "Capturas",
          title: "Nuevas ideas",
          emptyTitle: "No guardaste ideas hoy",
          emptyDescription: "Las ideas capturadas durante el día aparecerán aquí.",
          total: snapshot.newIdeas.length,
          items: ideaItems,
        },
        {
          id: "overdue",
          eyebrow: "Atención",
          title: "Tareas vencidas",
          emptyTitle: "Nada vencido",
          emptyDescription: "No tienes tareas anteriores a hoy pendientes.",
          total: snapshot.overdueTasks.length,
          items: snapshot.overdueTasks.slice(0, 8).map((task) => ({
            id: task.id,
            title: task.title,
            detail: taskDetail(task),
            href: task.projectId ? `/projects/${task.projectId}` : "/",
            badge: "Vencida",
          })),
        },
      ],
    };
  }

  return {
    kind,
    periodLabel: periodLabel(kind, localDateStartUtc(keys.start), localDateStartUtc(keys.end)),
    title: "Revisión semanal",
    description:
      "Observa el ritmo de la semana, los proyectos que avanzaron y dónde conviene recuperar atención.",
    metrics: [
      {
        label: "Completadas",
        value: snapshot.completedTasks.length,
        detail: "Tareas terminadas esta semana",
        color: "bg-emerald-500",
      },
      {
        label: "Proyectos activos",
        value: workedProjects.length,
        detail: "Con actividad en la semana",
        color: "bg-sky-500",
      },
      {
        label: "Sin actividad",
        value: inactiveProjects.length,
        detail: "Proyectos activos sin movimiento",
        color: "bg-slate-400",
      },
      {
        label: "Ideas nuevas",
        value: snapshot.newIdeas.length,
        detail: "Capturadas esta semana",
        color: "bg-amber-400",
      },
      {
        label: "Pendientes importantes",
        value: importantPending.length,
        detail: "Tareas abiertas de prioridad alta",
        color: "bg-rose-500",
      },
    ],
    sections: [
      {
        id: "completed",
        eyebrow: "Resultados",
        title: "Tareas completadas",
        emptyTitle: "Sin tareas completadas esta semana",
        emptyDescription: "El progreso completado aparecerá en esta sección.",
        total: snapshot.completedTasks.length,
        items: completedItems,
      },
      {
        id: "active-projects",
        eyebrow: "Ritmo",
        title: "Proyectos más activos",
        emptyTitle: "Sin actividad registrada",
        emptyDescription: "Los proyectos con movimiento aparecerán ordenados por actividad.",
        total: workedProjects.length,
        items: workedProjects.slice(0, 8).map((project, index) => ({
          id: project.id,
          title: project.name,
          detail: `${project.count} ${project.count === 1 ? "actividad" : "actividades"} esta semana`,
          href: `/projects/${project.id}`,
          badge: `#${index + 1}`,
        })),
      },
      {
        id: "inactive-projects",
        eyebrow: "Pausa consciente",
        title: "Proyectos sin actividad",
        emptyTitle: "Todos tus proyectos activos tuvieron movimiento",
        emptyDescription: "No hay proyectos activos olvidados esta semana.",
        total: inactiveProjects.length,
        items: inactiveProjects.slice(0, 8).map((project) => ({
          id: project.id,
          title: project.name,
          detail: "Sin tareas, ideas, notas ni cambios durante esta semana",
          href: `/projects/${project.id}`,
          badge: "Sin actividad",
        })),
      },
      {
        id: "new-ideas",
        eyebrow: "Exploración",
        title: "Nuevas ideas",
        emptyTitle: "No guardaste ideas esta semana",
        emptyDescription: "Las nuevas posibilidades aparecerán aquí.",
        total: snapshot.newIdeas.length,
        items: ideaItems,
      },
      {
        id: "important-pending",
        eyebrow: "Próxima semana",
        title: "Pendientes importantes",
        emptyTitle: "Sin pendientes de prioridad alta",
        emptyDescription: "No hay tareas importantes esperando atención.",
        total: importantPending.length,
        items: importantPending.slice(0, 8).map((task) => ({
          id: task.id,
          title: task.title,
          detail: taskDetail(task),
          href: task.projectId ? `/projects/${task.projectId}` : "/",
          badge: "Alta",
        })),
      },
    ],
  };
}
