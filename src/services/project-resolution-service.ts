import "server-only";

import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import type { ChatToolResult } from "@/services/chat-types";
import { listProjects } from "@/services/project-service";

export type UserProject = Awaited<ReturnType<typeof listProjects>>[number];

export type ProjectResolution =
  | { status: "none"; project: null }
  | { status: "found"; project: UserProject }
  | { status: "clarification"; result: ChatToolResult };

export function normalizeLifeOSName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

export async function resolveProject(
  userId: string,
  projectName: string | null,
  intent: LifeOSIntent["intent"],
): Promise<ProjectResolution> {
  if (!projectName) return { status: "none", project: null };

  const projects = await listProjects(userId);
  const expectedName = normalizeLifeOSName(projectName);
  const exactMatches = projects.filter(
    (project) => normalizeLifeOSName(project.name) === expectedName,
  );

  if (exactMatches.length === 1) {
    return { status: "found", project: exactMatches[0] };
  }

  if (exactMatches.length > 1) {
    return {
      status: "clarification",
      result: {
        intent,
        outcome: "clarification",
        reply: `Encontré más de un proyecto llamado “${projectName}”. ¿Cuál quieres usar?`,
        items: exactMatches.slice(0, 5).map((project) => ({
          label: project.name,
          detail: project.status,
          href: `/projects/${project.id}`,
        })),
        mutated: false,
      },
    };
  }

  const suggestions = projects
    .filter((project) => normalizeLifeOSName(project.name).includes(expectedName))
    .slice(0, 3);

  return {
    status: "clarification",
    result: {
      intent,
      outcome: "clarification",
      reply: `No encontré un proyecto llamado “${projectName}”. ¿Quieres usar otro proyecto o guardar esto sin proyecto?`,
      items: suggestions.map((project) => ({
        label: project.name,
        detail: "Proyecto parecido",
        href: `/projects/${project.id}`,
      })),
      mutated: false,
    },
  };
}

