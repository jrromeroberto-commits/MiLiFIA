import "server-only";

import { localDateKey, weekRange } from "@/lib/time/calendar";
import { listIdeas } from "@/services/idea-service";
import { getProjectDetail, listProjects } from "@/services/project-service";

export type IdeaQueryTimeframe = "TODAY" | "THIS_WEEK" | "ALL" | null;

export async function queryIdeas(
  userId: string,
  input: {
    timeframe: IdeaQueryTimeframe;
    projectId?: string;
    referenceDate?: Date;
  },
) {
  const [ideas, projects] = await Promise.all([
    listIdeas(userId),
    input.projectId ? Promise.resolve([]) : listProjects(userId),
  ]);
  const today = localDateKey(input.referenceDate ?? new Date());
  const week = weekRange(today);
  const filteredIdeas = ideas.filter((idea) => {
    if (input.projectId && idea.projectId !== input.projectId) return false;
    const createdDate = localDateKey(idea.createdAt);

    switch (input.timeframe) {
      case "TODAY":
        return createdDate === today;
      case "THIS_WEEK":
        return createdDate >= week.start && createdDate <= week.end;
      case "ALL":
      case null:
        return true;
    }
  });

  return {
    ideas: filteredIdeas,
    projectNames: new Map(projects.map((project) => [project.id, project.name])),
  };
}

export async function getProjectLatestActivity(
  userId: string,
  projectId: string,
) {
  const project = await getProjectDetail(userId, projectId);
  const candidates = [
    {
      at: project.updatedAt,
      label: `Se actualizó el proyecto “${project.name}”`,
      kind: "Proyecto" as const,
    },
    ...project.tasks.map((task) => ({
      at: task.updatedAt,
      label: task.title,
      kind: "Tarea" as const,
    })),
    ...project.ideas.map((idea) => ({
      at: idea.updatedAt,
      label: idea.title,
      kind: "Idea" as const,
    })),
    ...project.notes.map((note) => ({
      at: note.updatedAt,
      label: note.title ?? "Nota sin título",
      kind: "Nota" as const,
    })),
  ];
  const latest = candidates.reduce((current, candidate) =>
    candidate.at > current.at ? candidate : current,
  );

  return { project, latest };
}

