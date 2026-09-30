import "server-only";

import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { formatCalendarDate } from "@/lib/presentation/date";
import {
  localDateKey,
  offsetDateKey,
  weekRange,
} from "@/lib/time/calendar";
import { createIdea } from "@/services/idea-service";
import { executeExpenseIntent } from "@/services/expense-tool-service";
import { executeGrowthIntent } from "@/services/growth-tool-service";
import { executeIntelligentQuery } from "@/services/intelligent-query-tool-service";
import { createNote } from "@/services/note-service";
import { searchProjectFiles } from "@/services/file-search-service";
import { createProject, listProjects } from "@/services/project-service";
import {
  normalizeLifeOSName,
  resolveProject,
} from "@/services/project-resolution-service";
import { createTask, listTasks, updateTask } from "@/services/task-service";
import type { ChatToolResult } from "@/services/chat-types";

export type { ChatResultItem, ChatToolResult } from "@/services/chat-types";

const unfinishedStatuses = new Set(["TODO", "IN_PROGRESS"]);

function dueDateLabel(dueDate: Date | null) {
  return dueDate ? formatCalendarDate(dueDate) : "sin fecha";
}

function intentResult(
  intent: LifeOSIntent["intent"],
  values: Omit<ChatToolResult, "intent">,
): ChatToolResult {
  return { intent, ...values };
}

async function executeCreateTask(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "create_task" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;

  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const task = await createTask(userId, {
    projectId: project?.id ?? null,
    title: intent.title,
    description: intent.description,
    dueDate: intent.dueDate,
    priority: intent.priority ?? undefined,
  });
  const context = [
    project ? `en ${project.name}` : null,
    intent.dueDate ? `para el ${dueDateLabel(task.dueDate)}` : null,
  ].filter(Boolean);

  return intentResult(intent.intent, {
    outcome: "created",
    reply: `Listo, creé la tarea “${task.title}”${context.length ? ` ${context.join(" ")}` : ""}.`,
    items: [
      {
        label: task.title,
        detail: project?.name ?? "Sin proyecto",
        href: project ? `/projects/${project.id}` : "/",
      },
    ],
    mutated: true,
  });
}

async function executeCreateProject(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "create_project" }>,
) {
  const projects = await listProjects(userId);
  const existing = projects.find(
    (project) =>
      normalizeLifeOSName(project.name) === normalizeLifeOSName(intent.name),
  );

  if (existing) {
    return intentResult(intent.intent, {
      outcome: "answer",
      reply: `El proyecto “${existing.name}” ya existe; no creé un duplicado.`,
      items: [
        {
          label: existing.name,
          detail: existing.status,
          href: `/projects/${existing.id}`,
        },
      ],
      mutated: false,
    });
  }

  const project = await createProject(userId, {
    name: intent.name,
    description: intent.description,
  });

  return intentResult(intent.intent, {
    outcome: "created",
    reply: `Listo, creé el proyecto “${project.name}”.`,
    items: [
      {
        label: project.name,
        detail: "Proyecto activo",
        href: `/projects/${project.id}`,
      },
    ],
    mutated: true,
  });
}

async function executeCreateIdea(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "create_idea" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const idea = await createIdea(userId, {
    projectId: project?.id ?? null,
    title: intent.title,
    description: intent.description,
  });

  return intentResult(intent.intent, {
    outcome: "created",
    reply: `Guardé la idea “${idea.title}”${project ? ` en ${project.name}` : ""}.`,
    items: [
      {
        label: idea.title,
        detail: project?.name ?? "Idea independiente",
        href: project ? `/projects/${project.id}` : "/",
      },
    ],
    mutated: true,
  });
}

async function executeCreateNote(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "create_note" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const note = await createNote(userId, {
    projectId: project?.id ?? null,
    title: intent.title,
    content: intent.content,
  });

  return intentResult(intent.intent, {
    outcome: "created",
    reply: `Guardé ${note.title ? `la nota “${note.title}”` : "la nota"}${project ? ` en ${project.name}` : ""}.`,
    items: [
      {
        label: note.title ?? "Nota sin título",
        detail: project?.name ?? "Nota independiente",
        href: project ? `/projects/${project.id}` : "/",
      },
    ],
    mutated: true,
  });
}

async function executeListTasks(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "list_tasks" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const [tasks, projects] = await Promise.all([
    listTasks(userId),
    project ? Promise.resolve([]) : listProjects(userId),
  ]);
  const projectNames = new Map(
    (project ? [project] : projects).map((item) => [item.id, item.name]),
  );
  const today = localDateKey(new Date());
  const tomorrow = offsetDateKey(today, 1);
  const week = weekRange(today);
  const requestedStatus = intent.taskStatus ?? "PENDING";

  const filtered = tasks.filter((task) => {
    if (project && task.projectId !== project.id) return false;
    if (requestedStatus === "PENDING" && !unfinishedStatuses.has(task.status)) {
      return false;
    }
    if (requestedStatus === "COMPLETED" && task.status !== "COMPLETED") {
      return false;
    }

    const dueDate = task.dueDate?.toISOString().slice(0, 10) ?? null;
    switch (intent.timeframe) {
      case "TODAY":
        return dueDate === today;
      case "TOMORROW":
        return dueDate === tomorrow;
      case "THIS_WEEK":
        return dueDate !== null && dueDate >= week.start && dueDate <= week.end;
      case "OVERDUE":
        return dueDate !== null && dueDate < today && unfinishedStatuses.has(task.status);
      case "ALL":
      case null:
        return true;
    }
  });

  const scope = project ? ` en ${project.name}` : "";
  if (!filtered.length) {
    return intentResult(intent.intent, {
      outcome: "answer",
      reply: `No encontré tareas que coincidan con esa consulta${scope}.`,
      items: [],
      mutated: false,
    });
  }

  const visibleTasks = filtered.slice(0, 8);
  const truncated =
    filtered.length > visibleTasks.length ? " Te muestro las primeras ocho." : "";
  return intentResult(intent.intent, {
    outcome: "answer",
    reply: `Encontré ${filtered.length} ${filtered.length === 1 ? "tarea" : "tareas"}${scope}.${truncated}`,
    items: visibleTasks.map((task) => ({
      label: task.title,
      detail: [
        dueDateLabel(task.dueDate),
        task.projectId ? projectNames.get(task.projectId) : "sin proyecto",
      ]
        .filter(Boolean)
        .join(" · "),
      href: task.projectId ? `/projects/${task.projectId}` : "/",
    })),
    mutated: false,
  });
}

async function executeListProjects(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "list_projects" }>,
) {
  const projects = await listProjects(userId);
  const filtered = projects.filter(
    (project) =>
      !intent.projectStatus ||
      intent.projectStatus === "ALL" ||
      project.status === intent.projectStatus,
  );

  if (!filtered.length) {
    return intentResult(intent.intent, {
      outcome: "answer",
      reply: "No encontré proyectos que coincidan con esa consulta.",
      items: [],
      mutated: false,
    });
  }

  const visibleProjects = filtered.slice(0, 8);
  const truncated =
    filtered.length > visibleProjects.length
      ? " Te muestro los primeros ocho."
      : "";
  return intentResult(intent.intent, {
    outcome: "answer",
    reply: `Tienes ${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}.${truncated}`,
    items: visibleProjects.map((project) => ({
      label: project.name,
      detail: `${project.status} · ${project._count.tasks} tareas`,
      href: `/projects/${project.id}`,
    })),
    mutated: false,
  });
}

async function executeCompleteTask(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "complete_task" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const [tasks, projects] = await Promise.all([
    listTasks(userId),
    project ? Promise.resolve([]) : listProjects(userId),
  ]);
  const projectNames = new Map(
    (project ? [project] : projects).map((item) => [item.id, item.name]),
  );
  const expectedTitle = normalizeLifeOSName(intent.title);
  const candidates = tasks.filter(
    (task) =>
      unfinishedStatuses.has(task.status) &&
      (!project || task.projectId === project.id),
  );
  const exactMatches = candidates.filter(
    (task) => normalizeLifeOSName(task.title) === expectedTitle,
  );
  const matches = exactMatches.length
    ? exactMatches
    : candidates.filter((task) =>
        normalizeLifeOSName(task.title).includes(expectedTitle),
      );

  if (!matches.length) {
    return intentResult(intent.intent, {
      outcome: "clarification",
      reply: `No encontré una tarea pendiente llamada “${intent.title}”${project ? ` en ${project.name}` : ""}. ¿Puedes darme el título exacto?`,
      items: [],
      mutated: false,
    });
  }

  if (matches.length > 1) {
    return intentResult(intent.intent, {
      outcome: "clarification",
      reply: `Encontré ${matches.length} tareas parecidas. ¿Cuál quieres completar?`,
      items: matches.slice(0, 5).map((task) => ({
        label: task.title,
        detail: task.projectId
          ? (projectNames.get(task.projectId) ?? "Proyecto desconocido")
          : "Sin proyecto",
        href: task.projectId ? `/projects/${task.projectId}` : "/",
      })),
      mutated: false,
    });
  }

  const task = await updateTask(userId, matches[0].id, { status: "COMPLETED" });
  return intentResult(intent.intent, {
    outcome: "completed",
    reply: `Marqué como completada la tarea “${task.title}”.`,
    items: [
      {
        label: task.title,
        detail: "Completada",
        href: task.projectId ? `/projects/${task.projectId}` : "/",
      },
    ],
    mutated: true,
  });
}

async function executeSearchFiles(
  userId: string,
  intent: Extract<LifeOSIntent, { intent: "search_files" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project = projectResolution.status === "found" ? projectResolution.project : null;
  const matches = await searchProjectFiles(userId, {
    query: intent.fileQuery,
    projectId: project?.id,
  });

  if (!matches.length) {
    return intentResult(intent.intent, {
      outcome: "answer",
      reply: `No encontré archivos que coincidan con “${intent.fileQuery}”${project ? ` en ${project.name}` : ""}.`,
      items: [],
      mutated: false,
    });
  }

  return intentResult(intent.intent, {
    outcome: "answer",
    reply: `Encontré ${matches.length} ${matches.length === 1 ? "archivo" : "archivos"} con coincidencias reales. Abre el resultado para verificar el documento completo.`,
    items: matches.map((file) => ({
      label: file.originalName,
      detail: file.excerpt
        ? `${file.project.name} · “${file.excerpt}”`
        : `${file.project.name} · coincidencia en el nombre`,
      href: `/files/${file.id}/download`,
    })),
    mutated: false,
  });
}

export async function executeLifeOSIntent(userId: string, intent: LifeOSIntent) {
  if (intent.clarificationQuestion) {
    return intentResult(intent.intent, {
      outcome: "clarification",
      reply: intent.clarificationQuestion,
      items: [],
      mutated: false,
    });
  }

  switch (intent.intent) {
    case "create_task":
      return executeCreateTask(userId, intent);
    case "create_project":
      return executeCreateProject(userId, intent);
    case "create_idea":
      return executeCreateIdea(userId, intent);
    case "create_note":
      return executeCreateNote(userId, intent);
    case "list_tasks":
      return executeListTasks(userId, intent);
    case "list_projects":
      return executeListProjects(userId, intent);
    case "list_ideas":
      return executeIntelligentQuery(userId, intent);
    case "get_project_activity":
      return executeIntelligentQuery(userId, intent);
    case "create_expense":
      return executeExpenseIntent(userId, intent);
    case "summarize_expenses":
      return executeExpenseIntent(userId, intent);
    case "create_habit":
    case "log_habit":
    case "create_goal":
      return executeGrowthIntent(userId, intent);
    case "complete_task":
      return executeCompleteTask(userId, intent);
    case "search_files":
      return executeSearchFiles(userId, intent);
    case "unknown":
      return intentResult(intent.intent, {
        outcome: "clarification",
        reply: intent.clarificationQuestion,
        items: [],
        mutated: false,
      });
  }
}
