import "dotenv/config";

import assert from "node:assert/strict";
import {
  extractAudioCapture,
  parseAudioCaptureResponse,
} from "@/lib/ai/audio-capture-service";
import { AiServiceError } from "@/lib/ai/errors";
import type {
  StructuredOutputProvider,
  StructuredOutputRequest,
} from "@/lib/ai/provider";
import {
  AudioUploadValidationError,
  MAX_AUDIO_UPLOAD_BYTES,
  validateAudioUpload,
} from "@/lib/validation/audio-capture";

const validWebm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00]);
const validWav = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
]);

const rawItems = [
  {
    itemType: "TASK",
    sourceText: "Mañana tengo que revisar la tesis",
    title: "Revisar la tesis",
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: "2026-09-29",
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "TASK",
    sourceText: "terminar LifeOS",
    title: "Terminar LifeOS",
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "TASK",
    sourceText: "comprar un regalo",
    title: "Comprar un regalo",
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion: null,
  },
  {
    itemType: "UNKNOWN",
    sourceText: "llamar a [inaudible]",
    title: null,
    name: null,
    description: null,
    content: null,
    projectName: null,
    dueDate: null,
    priority: null,
    clarificationQuestion:
      "El audio podría decir Carlos o Carla. ¿Cuál es correcto?",
  },
] as const;

class FakeAudioProvider implements StructuredOutputProvider {
  lastRequest: StructuredOutputRequest | null = null;

  async generateStructuredOutput(request: StructuredOutputRequest) {
    this.lastRequest = request;
    return JSON.stringify({
      transcript:
        "Mañana tengo que revisar la tesis, terminar LifeOS, comprar un regalo y llamar a [inaudible].",
      items: rawItems,
    });
  }
}

async function main() {
  const provider = new FakeAudioProvider();
  const result = await extractAudioCapture(
    {
      bytes: validWebm,
      declaredMimeType: "audio/webm;codecs=opus",
      referenceDate: new Date("2026-09-28T15:00:00.000Z"),
      timeZone: "America/Lima",
    },
    { provider },
  );

  assert.match(result.transcript, /revisar la tesis/i);
  assert.deepEqual(
    result.items.map((item) => item.itemType),
    ["TASK", "TASK", "TASK", "UNKNOWN"],
  );
  assert.match(
    result.items[3].clarificationQuestion ?? "",
    /podría decir Carlos o Carla/i,
  );
  assert.match(provider.lastRequest?.systemInstruction ?? "", /2026-09-28/);
  assert.match(provider.lastRequest?.systemInstruction ?? "", /No inventes palabras/i);
  assert.equal(provider.lastRequest?.audio?.mimeType, "audio/webm");
  assert.equal(
    provider.lastRequest?.audio?.data,
    Buffer.from(validWebm).toString("base64"),
  );
  assert.equal(provider.lastRequest?.jsonSchema.additionalProperties, false);

  assert.equal(
    validateAudioUpload({
      bytes: validWav,
      declaredMimeType: "audio/x-wav",
    }).mimeType,
    "audio/wav",
  );
  assert.throws(
    () =>
      validateAudioUpload({
        bytes: validWebm,
        declaredMimeType: "audio/mpeg",
      }),
    (error) => error instanceof AudioUploadValidationError,
  );
  assert.throws(
    () =>
      validateAudioUpload({
        bytes: new Uint8Array(MAX_AUDIO_UPLOAD_BYTES + 1),
        declaredMimeType: "audio/webm",
      }),
    (error) => error instanceof AudioUploadValidationError,
  );
  assert.throws(
    () =>
      parseAudioCaptureResponse(
        JSON.stringify({
          transcript: "Crear un proyecto inventado.",
          items: [
            {
              ...rawItems[0],
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
    "Captura de audio verificada: formatos reales, transcripción, Gemini multimodal y ambigüedad segura.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
