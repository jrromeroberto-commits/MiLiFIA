import "server-only";

import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import { formatDateTime } from "@/lib/presentation/date";
import type { ChatToolResult } from "@/services/chat-types";
import {
  getProjectLatestActivity,
  queryIdeas,
} from "@/services/intelligent-query-service";
import { resolveProject } from "@/services/project-resolution-service";

type IntelligentQueryIntent = Extract<
  LifeOSIntent,
  { intent: "list_ideas" | "get_project_activity" }
>;

function result(
  intent: IntelligentQueryIntent["intent"],
  values: Omit<ChatToolResult, "intent">,
): ChatToolResult {
  return { intent, ...values };
}

async function executeListIdeas(
  userId: string,
  intent: Extract<IntelligentQueryIntent, { intent: "list_ideas" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  const project =
    projectResolution.status === "found" ? projectResolution.project : null;
  const { ideas: filtered, projectNames } = await queryIdeas(userId, {
    timeframe: intent.timeframe,
    projectId: project?.id,
  });
  if (project) projectNames.set(project.id, project.name);

  const scope = project ? ` en ${project.name}` : "";
  if (!filtered.length) {
    return result(intent.intent, {
      outcome: "answer",
      reply: `No encontré ideas que coincidan con esa consulta${scope}.`,
      items: [],
      mutated: false,
    });
  }

  const visibleIdeas = filtered.slice(0, 8);
  const truncated =
    filtered.length > visibleIdeas.length ? " Te muestro las primeras ocho." : "";

  return result(intent.intent, {
    outcome: "answer",
    reply: `Encontré ${filtered.length} ${filtered.length === 1 ? "idea" : "ideas"}${scope}.${truncated}`,
    items: visibleIdeas.map((idea) => ({
      label: idea.title,
      detail: [
        formatDateTime(idea.createdAt),
        idea.projectId ? projectNames.get(idea.projectId) : "idea independiente",
      ]
        .filter(Boolean)
        .join(" · "),
      href: idea.projectId ? `/projects/${idea.projectId}` : "/",
    })),
    mutated: false,
  });
}

async function executeGetProjectActivity(
  userId: string,
  intent: Extract<IntelligentQueryIntent, { intent: "get_project_activity" }>,
) {
  const projectResolution = await resolveProject(
    userId,
    intent.projectName,
    intent.intent,
  );
  if (projectResolution.status === "clarification") return projectResolution.result;
  if (projectResolution.status === "none") {
    return result(intent.intent, {
      outcome: "clarification",
      reply: "¿De qué proyecto quieres consultar la última actividad?",
      items: [],
      mutated: false,
    });
  }

  const { project, latest } = await getProjectLatestActivity(
    userId,
    projectResolution.project.id,
  );
  const when = formatDateTime(latest.at);

  return result(intent.intent, {
    outcome: "answer",
    reply: `La última actividad registrada en “${project.name}” fue el ${when}.`,
    items: [
      {
        label: latest.label,
        detail: `${latest.kind} · ${when}`,
        href: `/projects/${project.id}`,
      },
    ],
    mutated: false,
  });
}

export function executeIntelligentQuery(
  userId: string,
  intent: IntelligentQueryIntent,
) {
  switch (intent.intent) {
    case "list_ideas":
      return executeListIdeas(userId, intent);
    case "get_project_activity":
      return executeGetProjectActivity(userId, intent);
  }
}

