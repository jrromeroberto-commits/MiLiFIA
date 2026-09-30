import { createHash } from "node:crypto";

const CHUNK_SIZE = 1_000;
const CHUNK_OVERLAP = 150;
const MAX_CHUNKS = 200;

function splitPoint(text: string, start: number, idealEnd: number) {
  if (idealEnd >= text.length) return text.length;
  const minimum = Math.max(start + Math.floor(CHUNK_SIZE * 0.6), start + 1);
  const window = text.slice(minimum, idealEnd);
  const matches = [...window.matchAll(/[.!?]\s+|\n+/g)];
  const last = matches.at(-1);
  return last ? minimum + (last.index ?? 0) + last[0].length : idealEnd;
}

export function chunkText(text: string) {
  const chunks: Array<{ chunkIndex: number; content: string; contentHash: string }> = [];
  let start = 0;

  while (start < text.length && chunks.length < MAX_CHUNKS) {
    const end = splitPoint(text, start, Math.min(start + CHUNK_SIZE, text.length));
    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        chunkIndex: chunks.length,
        content,
        contentHash: createHash("sha256").update(content).digest("hex"),
      });
    }
    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}
