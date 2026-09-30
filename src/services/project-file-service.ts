import "server-only";

import { createHash } from "node:crypto";
import { chunkText } from "@/lib/files/chunker";
import {
  extractProjectFile,
  ProjectFileError,
} from "@/lib/files/extractor";
import { projectFileRepository } from "@/lib/db/repositories/project-file-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  projectFileInputSchema,
  type ProjectFileInput,
} from "@/lib/validation/project-file";
import { EntityNotFoundError } from "@/services/errors";
import { assertProjectOwnership } from "@/services/project-ownership";

function safeFileName(value: string) {
  const name = value.split(/[\\/]/).at(-1)?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name) throw new ProjectFileError("El archivo necesita un nombre válido.");
  return name.slice(0, 255);
}

export async function uploadProjectFile(userId: string, input: ProjectFileInput) {
  const ownerId = entityIdSchema.parse(userId);
  const parsed = projectFileInputSchema.parse({
    ...input,
    originalName: safeFileName(input.originalName),
  });
  await assertProjectOwnership(ownerId, parsed.projectId);

  // PDF.js puede transferir y separar el ArrayBuffer recibido. Conservamos una
  // copia independiente para que los bytes originales siempre lleguen a la BD.
  const storedData = Uint8Array.from(parsed.data);
  const extractionData = Uint8Array.from(parsed.data);
  const sha256 = createHash("sha256").update(storedData).digest("hex");
  const duplicate = await projectFileRepository.findDuplicate(parsed.projectId, sha256);
  if (duplicate) return { file: duplicate, duplicate: true } as const;

  const extraction = await extractProjectFile(parsed.mimeType, extractionData);
  const chunks = extraction.text ? chunkText(extraction.text) : [];
  const file = await projectFileRepository.create(ownerId, {
    ...parsed,
    data: storedData,
    size: storedData.byteLength,
    sha256,
    extractedText: extraction.text || null,
    processingStatus: chunks.length ? "READY" : "NO_TEXT",
    textTruncated: extraction.truncated,
    pageCount: extraction.pageCount,
    chunks,
  });

  return { file, duplicate: false } as const;
}

export async function getProjectFileDownload(userId: string, fileId: string) {
  const file = await projectFileRepository.findDownload(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(fileId),
  );
  if (!file) throw new EntityNotFoundError("El archivo");
  return file;
}

export async function deleteProjectFile(userId: string, fileId: string) {
  const deleted = await projectFileRepository.delete(
    entityIdSchema.parse(userId),
    entityIdSchema.parse(fileId),
  );
  if (!deleted) throw new EntityNotFoundError("El archivo");
}
