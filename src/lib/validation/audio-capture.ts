import { z } from "zod";
import { rawBrainDumpItemSchema } from "@/lib/validation/brain-dump";

export const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_RECORDING_SECONDS = 180;

export const audioMimeTypeSchema = z.enum([
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/m4a",
  "audio/ogg",
]);

export const audioCaptureResponseSchema = z
  .object({
    transcript: z.string().trim().min(1).max(20_000),
    items: z.array(rawBrainDumpItemSchema).min(1).max(20),
  })
  .strict()
  .superRefine((response, context) => {
    response.items.forEach((item, index) => {
      if (item.itemType === "PROJECT") {
        context.addIssue({
          code: "custom",
          path: ["items", index, "itemType"],
          message: "La captura de audio solo admite tareas, ideas y notas.",
        });
      }
    });
  });

export type AudioMimeType = z.infer<typeof audioMimeTypeSchema>;

export class AudioUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioUploadValidationError";
  }
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function detectedMimeType(bytes: Uint8Array): AudioMimeType | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "audio/webm";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WAVE"
  ) {
    return "audio/wav";
  }
  if (
    bytes.length >= 3 &&
    (ascii(bytes, 0, 3) === "ID3" ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
  ) {
    return "audio/mpeg";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    return "audio/m4a";
  }
  if (bytes.length >= 4 && ascii(bytes, 0, 4) === "OggS") {
    return "audio/ogg";
  }
  return null;
}

function normalizeDeclaredMimeType(value: string): AudioMimeType | null {
  const mimeType = value.toLowerCase().split(";", 1)[0].trim();
  switch (mimeType) {
    case "audio/webm":
      return "audio/webm";
    case "audio/wav":
    case "audio/x-wav":
      return "audio/wav";
    case "audio/mp3":
    case "audio/mpeg":
      return "audio/mpeg";
    case "audio/mp4":
    case "audio/m4a":
    case "audio/x-m4a":
      return "audio/m4a";
    case "audio/ogg":
      return "audio/ogg";
    default:
      return null;
  }
}

export function validateAudioUpload(input: {
  bytes: Uint8Array;
  declaredMimeType: string;
}) {
  if (!input.bytes.length) {
    throw new AudioUploadValidationError("El audio está vacío.");
  }
  if (input.bytes.length > MAX_AUDIO_UPLOAD_BYTES) {
    throw new AudioUploadValidationError(
      "El audio supera el límite de 10 MB.",
    );
  }

  const declaredMimeType = normalizeDeclaredMimeType(input.declaredMimeType);
  if (!declaredMimeType) {
    throw new AudioUploadValidationError(
      "Usa un audio WebM, WAV, MP3, M4A u OGG.",
    );
  }

  const actualMimeType = detectedMimeType(input.bytes);
  if (!actualMimeType || actualMimeType !== declaredMimeType) {
    throw new AudioUploadValidationError(
      "El contenido del archivo no coincide con un audio válido y compatible.",
    );
  }

  return { bytes: input.bytes, mimeType: actualMimeType };
}
