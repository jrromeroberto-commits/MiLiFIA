import "server-only";

import { timelineRepository } from "@/lib/db/repositories/timeline-repository";
import {
  calendarDateUtc,
  localDateKey,
  localDateRangeUtc,
  offsetDateKey,
  weekRange,
} from "@/lib/time/calendar";
import { entityIdSchema } from "@/lib/validation/common";
import {
  timelineQuerySchema,
  type TimelinePeriod,
  type TimelineQuery,
} from "@/lib/validation/timeline";

export type TimelineEventKind =
  | "PROJECT_CREATED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "IDEA_CREATED"
  | "NOTE_CREATED"
  | "EXPENSE_RECORDED"
  | "HABIT_CREATED"
  | "HABIT_LOGGED"
  | "GOAL_CREATED"
  | "GOAL_COMPLETED"
  | "FILE_ADDED";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  title: string;
  detail: string;
  at: Date;
  href: string;
  projectId: string | null;
};

export type TimelineGroup = {
  dateKey: string;
  label: string;
  events: TimelineEvent[];
};

export type PersonalTimeline = {
  period: TimelinePeriod;
  selectedDate: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  previousDate: string;
  nextDate: string;
  metrics: {
    totalEvents: number;
    completedTasks: number;
    activeProjects: number;
    capturedItems: number;
  };
  groups: TimelineGroup[];
};

function formatProject(project: { name: string } | null) {
  return project ? `Proyecto: ${project.name}` : "Sin proyecto";
}

function projectHref(project: { id: string } | null) {
  return project ? `/projects/${project.id}` : "/";
}

function formatAmount(amount: { toString(): string }, currency: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(Number(amount.toString()));
}

function dayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(calendarDateUtc(dateKey));
}

function shortDate(dateKey: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(calendarDateUtc(dateKey));
}

function withinRange(at: Date, range: { start: Date; endExclusive: Date }) {
  return at >= range.start && at < range.endExclusive;
}

function toEvents(
  snapshot: Awaited<ReturnType<typeof timelineRepository.list>>,
  range: { start: Date; endExclusive: Date },
) {
  const events: TimelineEvent[] = [];

  for (const project of snapshot.projects) {
    events.push({
      id: `project-created-${project.id}`,
      kind: "PROJECT_CREATED",
      title: "Creaste un proyecto",
      detail: project.name,
      at: project.createdAt,
      href: `/projects/${project.id}`,
      projectId: project.id,
    });
  }

  for (const task of snapshot.tasks) {
    if (withinRange(task.createdAt, range)) {
      events.push({
        id: `task-created-${task.id}`,
        kind: "TASK_CREATED",
        title: "Creaste una tarea",
        detail: `${task.title} · ${formatProject(task.project)}`,
        at: task.createdAt,
        href: projectHref(task.project),
        projectId: task.project?.id ?? null,
      });
    }
    if (task.completedAt && withinRange(task.completedAt, range)) {
      events.push({
        id: `task-completed-${task.id}`,
        kind: "TASK_COMPLETED",
        title: "Terminaste una tarea",
        detail: `${task.title} · ${formatProject(task.project)}`,
        at: task.completedAt,
        href: projectHref(task.project),
        projectId: task.project?.id ?? null,
      });
    }
  }

  for (const idea of snapshot.ideas) {
    events.push({
      id: `idea-created-${idea.id}`,
      kind: "IDEA_CREATED",
      title: "Guardaste una idea",
      detail: `${idea.title} · ${formatProject(idea.project)}`,
      at: idea.createdAt,
      href: projectHref(idea.project),
      projectId: idea.project?.id ?? null,
    });
  }

  for (const note of snapshot.notes) {
    events.push({
      id: `note-created-${note.id}`,
      kind: "NOTE_CREATED",
      title: "Guardaste una nota",
      detail: `${note.title ?? "Nota sin título"} · ${formatProject(note.project)}`,
      at: note.createdAt,
      href: projectHref(note.project),
      projectId: note.project?.id ?? null,
    });
  }

  for (const expense of snapshot.expenses) {
    events.push({
      id: `expense-recorded-${expense.id}`,
      kind: "EXPENSE_RECORDED",
      title: "Registraste un gasto",
      detail: `${formatAmount(expense.amount, expense.currency)} · ${expense.description}${expense.project ? ` · ${expense.project.name}` : ""}`,
      at: expense.createdAt,
      href: projectHref(expense.project),
      projectId: expense.project?.id ?? null,
    });
  }

  for (const habit of snapshot.habits) {
    events.push({
      id: `habit-created-${habit.id}`,
      kind: "HABIT_CREATED",
      title: "Creaste un hábito",
      detail: habit.name,
      at: habit.createdAt,
      href: "/growth",
      projectId: null,
    });
  }

  for (const log of snapshot.habitLogs) {
    events.push({
      id: `habit-logged-${log.id}`,
      kind: "HABIT_LOGGED",
      title: "Registraste un hábito",
      detail: `${log.habit.name} · ${Number(log.value.toString())} ${log.habit.unit}`,
      at: log.createdAt,
      href: "/growth",
      projectId: null,
    });
  }

  for (const goal of snapshot.goals) {
    if (withinRange(goal.createdAt, range)) {
      events.push({
        id: `goal-created-${goal.id}`,
        kind: "GOAL_CREATED",
        title: "Creaste una meta",
        detail: goal.title,
        at: goal.createdAt,
        href: "/growth",
        projectId: null,
      });
    }
    if (goal.completedAt && withinRange(goal.completedAt, range)) {
      events.push({
        id: `goal-completed-${goal.id}`,
        kind: "GOAL_COMPLETED",
        title: "Completaste una meta",
        detail: goal.title,
        at: goal.completedAt,
        href: "/growth",
        projectId: null,
      });
    }
  }

  for (const file of snapshot.files) {
    events.push({
      id: `file-added-${file.id}`,
      kind: "FILE_ADDED",
      title: "Agregaste un archivo",
      detail: `${file.originalName} · Proyecto: ${file.project.name}`,
      at: file.createdAt,
      href: `/files/${file.id}/download`,
      projectId: file.project.id,
    });
  }

  return events.sort((left, right) => right.at.getTime() - left.at.getTime());
}

export async function getPersonalTimeline(userId: string, input: TimelineQuery) {
  const ownerId = entityIdSchema.parse(userId);
  const query = timelineQuerySchema.parse(input);
  const dates = query.period === "daily"
    ? { start: query.date, end: query.date }
    : weekRange(query.date);
  const range = localDateRangeUtc(dates.start, dates.end);
  const snapshot = await timelineRepository.list(ownerId, range);
  const events = toEvents(snapshot, range);
  const groupsByDate = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const dateKey = localDateKey(event.at);
    groupsByDate.set(dateKey, [...(groupsByDate.get(dateKey) ?? []), event]);
  }

  const groups = [...groupsByDate.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([dateKey, groupedEvents]) => ({
      dateKey,
      label: dayLabel(dateKey),
      events: groupedEvents,
    }));
  const projectIds = new Set(events.flatMap((event) => event.projectId ? [event.projectId] : []));
  const capturedKinds = new Set<TimelineEventKind>([
    "IDEA_CREATED",
    "NOTE_CREATED",
    "FILE_ADDED",
  ]);
  const step = query.period === "daily" ? 1 : 7;

  return {
    period: query.period,
    selectedDate: query.date,
    startDate: dates.start,
    endDate: dates.end,
    periodLabel: query.period === "daily"
      ? dayLabel(dates.start)
      : `${shortDate(dates.start)} — ${shortDate(dates.end)}`,
    previousDate: offsetDateKey(dates.start, -step),
    nextDate: offsetDateKey(dates.start, step),
    metrics: {
      totalEvents: events.length,
      completedTasks: events.filter((event) => event.kind === "TASK_COMPLETED").length,
      activeProjects: projectIds.size,
      capturedItems: events.filter((event) => capturedKinds.has(event.kind)).length,
    },
    groups,
  } satisfies PersonalTimeline;
}
