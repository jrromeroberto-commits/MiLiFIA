import "server-only";

import { projectFileRepository } from "@/lib/db/repositories/project-file-repository";
import { entityIdSchema } from "@/lib/validation/common";
import {
  fileSearchInputSchema,
  type FileSearchInput,
} from "@/lib/validation/project-file";
import { normalizeLifeOSName } from "@/services/project-resolution-service";

const stopWords = new Set([
  "donde", "esta", "estan", "el", "la", "los", "las", "un", "una", "de", "del",
  "documento", "archivo", "relacionado", "relacionada", "con", "sobre", "mi", "mis",
  "encontrar", "encuentra", "buscar", "busca", "quiero", "necesito",
]);

export function fileSearchTerms(query: string) {
  const normalized = normalizeLifeOSName(query);
  const useful = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length >= 2 && !stopWords.has(term));
  return [...new Set(useful)].slice(0, 8);
}

function excerpt(content: string, terms: string[]) {
  const normalized = normalizeLifeOSName(content);
  const positions = terms.map((term) => normalized.indexOf(term)).filter((value) => value >= 0);
  const position = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, position - 90);
  const end = Math.min(content.length, position + 230);
  return `${start ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`;
}

export async function searchProjectFiles(userId: string, input: FileSearchInput) {
  const ownerId = entityIdSchema.parse(userId);
  const parsed = fileSearchInputSchema.parse(input);
  const terms = fileSearchTerms(parsed.query);
  if (!terms.length) return [];

  const files = await projectFileRepository.search(ownerId, terms, parsed.projectId);
  return files
    .map((file) => {
      const normalizedName = normalizeLifeOSName(file.originalName);
      const nameScore = terms.reduce((score, term) => score + (normalizedName.includes(term) ? 4 : 0), 0);
      const bestChunk = file.chunks
        .map((chunk) => ({
          ...chunk,
          score: terms.reduce(
            (score, term) => score + (normalizeLifeOSName(chunk.content).includes(term) ? 1 : 0),
            0,
          ),
        }))
        .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex)[0];
      return {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        processingStatus: file.processingStatus,
        project: file.project,
        excerpt: bestChunk ? excerpt(bestChunk.content, terms) : null,
        score: nameScore + (bestChunk?.score ?? 0),
      };
    })
    .sort((a, b) => b.score - a.score || a.originalName.localeCompare(b.originalName, "es"))
    .slice(0, 8);
}
