import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_EXTRACTED_CHARACTERS = 1_000_000;
const MAX_PDF_PAGES = 100;
const EXTRACTION_TIMEOUT_MS = 15_000;

export const supportedFileTypes = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "txt",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type SupportedMimeType = keyof typeof supportedFileTypes;

export class ProjectFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectFileError";
  }
}

function startsWith(data: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => data[index] === byte);
}

function assertSignature(mimeType: SupportedMimeType, data: Uint8Array) {
  const valid = {
    "application/pdf": startsWith(data, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": startsWith(data, [0x50, 0x4b]),
    "application/msword": startsWith(data, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    "text/plain": !data.includes(0),
    "image/jpeg": startsWith(data, [0xff, 0xd8, 0xff]),
    "image/png": startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    "image/webp": startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP",
  }[mimeType];

  if (!valid) throw new ProjectFileError("El contenido no coincide con el tipo de archivo declarado.");
}

async function withTimeout<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new ProjectFileError("La extracción de texto tardó demasiado.")),
          EXTRACTION_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function boundedText(value: string) {
  const normalized = normalizeExtractedText(value);
  return {
    text: normalized.slice(0, MAX_EXTRACTED_CHARACTERS),
    truncated: normalized.length > MAX_EXTRACTED_CHARACTERS,
  };
}

export async function extractProjectFile(mimeType: string, data: Uint8Array) {
  if (!(mimeType in supportedFileTypes)) {
    throw new ProjectFileError("Tipo no permitido. Usa PDF, DOC, DOCX, TXT, JPG, PNG o WebP.");
  }

  const safeMimeType = mimeType as SupportedMimeType;
  assertSignature(safeMimeType, data);

  if (safeMimeType === "text/plain") {
    try {
      return { ...boundedText(new TextDecoder("utf-8", { fatal: true }).decode(data)), pageCount: null };
    } catch {
      throw new ProjectFileError("El TXT debe estar codificado en UTF-8.");
    }
  }

  if (safeMimeType === "application/pdf") {
    let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null;
    try {
      pdf = await withTimeout(getDocumentProxy(data, { maxImageSize: 16_777_216 }));
      if (pdf.numPages > MAX_PDF_PAGES) {
        throw new ProjectFileError("El PDF supera el límite de 100 páginas.");
      }
      const result = await withTimeout(extractText(pdf, { mergePages: true }));
      return { ...boundedText(result.text), pageCount: result.totalPages };
    } catch (error) {
      if (error instanceof ProjectFileError) throw error;
      throw new ProjectFileError("No se pudo leer el PDF. Verifica que no esté dañado o protegido.");
    } finally {
      await pdf?.cleanup();
    }
  }

  if (safeMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const result = await withTimeout(mammoth.extractRawText({ buffer: Buffer.from(data) }));
      return { ...boundedText(result.value), pageCount: null };
    } catch (error) {
      if (error instanceof ProjectFileError) throw error;
      throw new ProjectFileError("No se pudo leer el DOCX. Verifica que no esté dañado.");
    }
  }

  return { text: "", truncated: false, pageCount: null };
}
