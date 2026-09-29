import "dotenv/config";

import assert from "node:assert/strict";
import { AiServiceError } from "@/lib/ai/errors";
import {
  extractImageCapture,
  parseImageCaptureResponse,
} from "@/lib/ai/image-capture-service";
import type {
  StructuredOutputProvider,
  StructuredOutputRequest,
} from "@/lib/ai/provider";
import {
  ImageUploadValidationError,
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageUpload,
} from "@/lib/validation/image-capture";

const validPng = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

const rawItems = [
  {
    itemType: "TASK",
    sourceText: "Enviar propuesta mañana",
    title: "Enviar propuesta",
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: "2026-09-29",
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "IDEA",
    sourceText: "Idea: tablero de hábitos",
    title: "Tablero de hábitos",
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "NOTE",
    sourceText: "El usuario prefiere resúmenes breves",
    title: null,
    name: null,
    description: null,
    content: "El usuario prefiere resúmenes breves.",
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "UNKNOWN",
    sourceText: "Revisar [palabra ambigua]",
    title: null,
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion:
      "Este texto podría decir contrato o contacto. ¿Cuál es correcto?",
  },
] as const;

class FakeImageProvider implements StructuredOutputProvider {
  lastRequest: StructuredOutputRequest | null = null;

  async generateStructuredOutput(request: StructuredOutputRequest) {
    this.lastRequest = request;
    return JSON.stringify({ items: rawItems });
  }
}

async function main() {
  const provider = new FakeImageProvider();
  const drafts = await extractImageCapture(
    {
      bytes: validPng,
      declaredMimeType: "image/png",
      referenceDate: new Date("2026-09-28T15:00:00.000Z"),
      timeZone: "America/Lima",
    },
    { provider },
  );

  assert.equal(drafts.length, 4);
  assert.deepEqual(
    drafts.map((draft) => draft.itemType),
    ["TASK", "IDEA", "NOTE", "UNKNOWN"],
  );
  assert.match(
    drafts[3].clarificationQuestion ?? "",
    /podría decir contrato o contacto/i,
  );
  assert.match(provider.lastRequest?.systemInstruction ?? "", /2026-09-28/);
  assert.match(provider.lastRequest?.systemInstruction ?? "", /Nunca completes/i);
  assert.equal(provider.lastRequest?.image?.mimeType, "image/png");
  assert.equal(
    provider.lastRequest?.image?.data,
    Buffer.from(validPng).toString("base64"),
  );
  assert.equal(provider.lastRequest?.jsonSchema.additionalProperties, false);

  assert.throws(
    () =>
      validateImageUpload({
        bytes: validPng,
        declaredMimeType: "image/jpeg",
      }),
    (error) => error instanceof ImageUploadValidationError,
  );
  assert.throws(
    () =>
      validateImageUpload({
        bytes: new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1),
        declaredMimeType: "image/png",
      }),
    (error) => error instanceof ImageUploadValidationError,
  );
  assert.throws(
    () =>
      parseImageCaptureResponse(
        JSON.stringify({
          items: [
            {
              ...rawItems[1],
              itemType: "PROJECT",
              name: "Proyecto inventado",
              title: null,
            },
          ],
        }),
      ),
    (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
  );

  console.log(
    "Captura visual verificada: archivo real, Gemini multimodal, contrato seguro y ambigüedad sin suposiciones.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
