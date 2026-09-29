import "server-only";

import { db } from "@/lib/db/client";
import { entityIdSchema } from "@/lib/validation/common";
import {
  confirmedBrainDumpSchema,
  type ConfirmedBrainDumpItem,
} from "@/lib/validation/brain-dump";

export class BrainDumpValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainDumpValidationError";
  }
}

export type SavedBrainDumpItem = {
  id: string;
  itemType: Exclude<ConfirmedBrainDumpItem["itemType"], "UNKNOWN">;
  label: string;
  href: string;
  created: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function saveConfirmedBrainDump(
  userId: string,
  input: ConfirmedBrainDumpItem[],
): Promise<SavedBrainDumpItem[]> {
  const ownerId = entityIdSchema.parse(userId);
  const items = confirmedBrainDumpSchema.parse(input);

  return db.$transaction(async (transaction) => {
    const existingProjects = await transaction.project.findMany({
      where: { userId: ownerId },
    });
    const existingByName = new Map<string, typeof existingProjects>();

    for (const project of existingProjects) {
      const key = normalize(project.name);
      existingByName.set(key, [...(existingByName.get(key) ?? []), project]);
    }

    const projectDrafts = items.filter(
      (item): item is ConfirmedBrainDumpItem & { itemType: "PROJECT"; name: string } =>
        item.itemType === "PROJECT" && Boolean(item.name),
    );
    const draftByName = new Map<string, (typeof projectDrafts)[number]>();

    for (const draft of projectDrafts) {
      const key = normalize(draft.name);
      if (draftByName.has(key)) {
        throw new BrainDumpValidationError(
          `Hay más de una propuesta para el proyecto “${draft.name}”. Deja solo una antes de guardar.`,
        );
      }
      draftByName.set(key, draft);
    }

    for (const candidates of existingByName.values()) {
      if (candidates.length > 1) {
        throw new BrainDumpValidationError(
          `Hay proyectos con nombres equivalentes a “${candidates[0].name}”. Corrige esa ambigüedad antes de guardar.`,
        );
      }
    }

    for (const item of items) {
      if (!item.projectName) continue;
      const key = normalize(item.projectName);
      if (!existingByName.has(key) && !draftByName.has(key)) {
        throw new BrainDumpValidationError(
          `No existe el proyecto “${item.projectName}”. Agrégalo como propuesta, cambia el nombre o deja el campo vacío.`,
        );
      }
    }

    const projectIdByName = new Map<string, string>();
    for (const [key, projects] of existingByName) {
      projectIdByName.set(key, projects[0].id);
    }

    const saved: SavedBrainDumpItem[] = [];
    for (const draft of projectDrafts) {
      const key = normalize(draft.name);
      const existingId = projectIdByName.get(key);
      if (existingId) {
        saved.push({
          id: draft.id,
          itemType: "PROJECT",
          label: draft.name,
          href: `/projects/${existingId}`,
          created: false,
        });
        continue;
      }

      const project = await transaction.project.create({
        data: {
          userId: ownerId,
          name: draft.name,
          description: draft.description,
        },
      });
      projectIdByName.set(key, project.id);
      saved.push({
        id: draft.id,
        itemType: "PROJECT",
        label: project.name,
        href: `/projects/${project.id}`,
        created: true,
      });
    }

    for (const item of items) {
      if (item.itemType === "PROJECT") continue;
      const projectId = item.projectName
        ? projectIdByName.get(normalize(item.projectName))
        : undefined;

      switch (item.itemType) {
        case "TASK": {
          const task = await transaction.task.create({
            data: {
              userId: ownerId,
              projectId: projectId ?? null,
              title: item.title!,
              description: item.description,
              dueDate: calendarDate(item.dueDate),
              ...(item.priority ? { priority: item.priority } : {}),
            },
          });
          saved.push({
            id: item.id,
            itemType: "TASK",
            label: task.title,
            href: projectId ? `/projects/${projectId}` : "/",
            created: true,
          });
          break;
        }
        case "IDEA": {
          const idea = await transaction.idea.create({
            data: {
              userId: ownerId,
              projectId: projectId ?? null,
              title: item.title!,
              description: item.description,
            },
          });
          saved.push({
            id: item.id,
            itemType: "IDEA",
            label: idea.title,
            href: projectId ? `/projects/${projectId}` : "/",
            created: true,
          });
          break;
        }
        case "NOTE": {
          const note = await transaction.note.create({
            data: {
              userId: ownerId,
              projectId: projectId ?? null,
              title: item.title,
              content: item.content!,
            },
          });
          saved.push({
            id: item.id,
            itemType: "NOTE",
            label: note.title ?? "Nota sin título",
            href: projectId ? `/projects/${projectId}` : "/",
            created: true,
          });
          break;
        }
        case "UNKNOWN":
          throw new BrainDumpValidationError(
            "Aclara o excluye las propuestas pendientes antes de guardar.",
          );
      }
    }

    return saved;
  });
}

