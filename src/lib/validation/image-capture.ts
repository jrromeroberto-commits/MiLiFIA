import { z } from "zod";
import { rawBrainDumpResponseSchema } from "@/lib/validation/brain-dump";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const imageMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const imageCaptureResponseSchema = rawBrainDumpResponseSchema.superRefine(
  (response, context) => {
    response.items.forEach((item, index) => {
      if (item.itemType === "PROJECT") {
        context.addIssue({
          code: "custom",
          path: ["items", index, "itemType"],
          message: "La captura visual solo admite tareas, ideas y notas.",
        });
      }
    });
  },
);

export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>;

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadValidationError";
  }
}

function detectedMimeType(bytes: Uint8Array): ImageMimeType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function validateImageUpload(input: {
  bytes: Uint8Array;
  declaredMimeType: string;
}) {
  if (!input.bytes.length) {
    throw new ImageUploadValidationError("La imagen está vacía.");
  }
  if (input.bytes.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ImageUploadValidationError(
      "La imagen supera el límite de 5 MB.",
    );
  }

  const declaredMimeType = imageMimeTypeSchema.safeParse(input.declaredMimeType);
  if (!declaredMimeType.success) {
    throw new ImageUploadValidationError(
      "Usa una imagen JPEG, PNG o WebP.",
    );
  }

  const actualMimeType = detectedMimeType(input.bytes);
  if (!actualMimeType || actualMimeType !== declaredMimeType.data) {
    throw new ImageUploadValidationError(
      "El contenido del archivo no coincide con un JPEG, PNG o WebP válido.",
    );
  }

  return { bytes: input.bytes, mimeType: actualMimeType };
}
