import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import {
  extractBrainDump,
  parseBrainDumpResponse,
} from "@/lib/ai/brain-dump-service";
import { AiServiceError } from "@/lib/ai/errors";
import type {
  StructuredOutputProvider,
  StructuredOutputRequest,
} from "@/lib/ai/provider";
import type { ConfirmedBrainDumpItem } from "@/lib/validation/brain-dump";
import {
  BrainDumpValidationError,
  saveConfirmedBrainDump,
} from "@/services/brain-dump-service";

const suffix = randomUUID().slice(0, 8);
const projectName = `Vaciado verificación ${suffix}`;
const taskTitle = `Revisar tesis ${suffix}`;
const ideaTitle = `Aplicación de viajes ${suffix}`;
const noteTitle = `Nota de captura ${suffix}`;

const rawItems = [
  {
    itemType: "PROJECT",
    sourceText: `organizar el proyecto ${projectName}`,
    title: null,
    name: projectName,
    description: "Proyecto temporal de verificación.",
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "TASK",
    sourceText: "mañana revisar la tesis",
    title: taskTitle,
    name: null,
    description: null,
    content: null,
    projectName,
    dueDate: "2026-09-29",
    priority: "HIGH",
    clarificationQuestion: null,
  },
  {
    itemType: "IDEA",
    sourceText: "idea para una aplicación de viajes",
    title: ideaTitle,
    name: null,
    description: "Aplicación para organizar recorridos.",
    content: null,
    projectName,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "NOTE",
    sourceText: "recordar que las capturas requieren confirmación",
    title: noteTitle,
    name: null,
    description: null,
    content: "Las capturas múltiples se guardan solo después de confirmar.",
    projectName,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
] as const;

class FakeBrainDumpProvider implements StructuredOutputProvider {
  lastRequest: StructuredOutputRequest | null = null;

  async generateStructuredOutput(request: StructuredOutputRequest) {
    this.lastRequest = request;
    return JSON.stringify({ items: rawItems });
  }
}

async function main() {
  const provider = new FakeBrainDumpProvider();
  const drafts = await extractBrainDump(
    {
      text: "Mañana revisar la tesis. También tengo una idea de viajes y una nota.",
      referenceDate: new Date("2026-09-28T15:00:00.000Z"),
      timeZone: "America/Lima",
    },
    { provider },
  );

  assert.equal(drafts.length, 4);
  assert.equal(provider.lastRequest?.maxOutputTokens, 4_096);
  assert.match(provider.lastRequest?.systemInstruction ?? "", /2026-09-28/);
  assert.equal(provider.lastRequest?.jsonSchema.additionalProperties, false);

  assert.throws(
    () =>
      parseBrainDumpResponse(
        JSON.stringify({
          items: [{ ...rawItems[1], title: null }],
        }),
      ),
    (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
  );

  const user = await requireCurrentUser();
  const confirmed = drafts as ConfirmedBrainDumpItem[];
  const saved = await saveConfirmedBrainDump(user.id, confirmed);
  assert.equal(saved.filter((item) => item.created).length, 4);

  const project = await db.project.findFirst({
    where: { userId: user.id, name: projectName },
  });
  assert(project);
  assert(await db.task.findFirst({ where: { userId: user.id, title: taskTitle, projectId: project.id } }));
  assert(await db.idea.findFirst({ where: { userId: user.id, title: ideaTitle, projectId: project.id } }));
  assert(await db.note.findFirst({ where: { userId: user.id, title: noteTitle, projectId: project.id } }));

  const repeat = await saveConfirmedBrainDump(user.id, [confirmed[0]]);
  assert.equal(repeat[0].created, false);

  const blockedTitle = `No debe guardarse ${suffix}`;
  await assert.rejects(
    () =>
      saveConfirmedBrainDump(user.id, [
        {
          ...confirmed[1],
          id: randomUUID(),
          title: blockedTitle,
          projectName: `Proyecto inexistente ${suffix}`,
        },
      ]),
    (error) => error instanceof BrainDumpValidationError,
  );
  assert.equal(
    await db.task.count({ where: { userId: user.id, title: blockedTitle } }),
    0,
  );

  console.log(
    "Vaciado mental verificado: contrato IA, confirmación, lote atómico y 4 entidades reales.",
  );
}

async function cleanup() {
  const user = await requireCurrentUser();
  await db.task.deleteMany({ where: { userId: user.id, title: taskTitle } });
  await db.idea.deleteMany({ where: { userId: user.id, title: ideaTitle } });
  await db.note.deleteMany({ where: { userId: user.id, title: noteTitle } });
  await db.project.deleteMany({ where: { userId: user.id, name: projectName } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await db.$disconnect();
  });
