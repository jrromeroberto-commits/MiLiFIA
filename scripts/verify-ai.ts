import assert from "node:assert/strict";
import { AiServiceError } from "@/lib/ai/errors";
import { GeminiStructuredOutputProvider } from "@/lib/ai/gemini-provider";
import {
  interpretLifeOSText,
  parseIntentResponse,
} from "@/lib/ai/intent-service";
import type {
  StructuredOutputProvider,
  StructuredOutputRequest,
} from "@/lib/ai/provider";

const emptyResponse = {
  title: null,
  name: null,
  description: null,
  content: null,
  projectName: null,
  dueDate: null,
  priority: null,
  taskStatus: null,
  timeframe: null,
  projectStatus: null,
  clarificationQuestion: null,
};

class FakeIntentProvider implements StructuredOutputProvider {
  lastRequest: StructuredOutputRequest | null = null;

  constructor(private readonly response: unknown) {}

  async generateStructuredOutput(request: StructuredOutputRequest) {
    this.lastRequest = request;
    return JSON.stringify(this.response);
  }
}

const fixtures = [
  {
    response: {
      ...emptyResponse,
      intent: "create_task",
      title: "Revisar tesis",
      dueDate: "2026-09-29",
    },
    intent: "create_task",
  },
  {
    response: { ...emptyResponse, intent: "create_project", name: "LifeOS" },
    intent: "create_project",
  },
  {
    response: {
      ...emptyResponse,
      intent: "create_idea",
      title: "Aplicación de viajes",
    },
    intent: "create_idea",
  },
  {
    response: {
      ...emptyResponse,
      intent: "create_note",
      content: "Recordar revisar la arquitectura.",
    },
    intent: "create_note",
  },
  {
    response: {
      ...emptyResponse,
      intent: "list_tasks",
      taskStatus: "PENDING",
      timeframe: "THIS_WEEK",
    },
    intent: "list_tasks",
  },
  {
    response: {
      ...emptyResponse,
      intent: "list_projects",
      projectStatus: "ACTIVE",
    },
    intent: "list_projects",
  },
  {
    response: {
      ...emptyResponse,
      intent: "list_ideas",
      timeframe: "THIS_WEEK",
    },
    intent: "list_ideas",
  },
  {
    response: {
      ...emptyResponse,
      intent: "get_project_activity",
      projectName: "LifeOS",
    },
    intent: "get_project_activity",
  },
  {
    response: {
      ...emptyResponse,
      intent: "complete_task",
      title: "Revisar login",
    },
    intent: "complete_task",
  },
  {
    response: {
      ...emptyResponse,
      intent: "unknown",
      clarificationQuestion: "¿Qué quieres guardar o consultar en LifeOS?",
    },
    intent: "unknown",
  },
] as const;

for (const fixture of fixtures) {
  const provider = new FakeIntentProvider(fixture.response);
  const result = await interpretLifeOSText(
    {
      text: "Mensaje de prueba",
      referenceDate: new Date("2026-09-28T15:00:00.000Z"),
      timeZone: "America/Lima",
    },
    { provider },
  );

  assert.equal(result.intent, fixture.intent);
  assert.equal(
    provider.lastRequest?.model,
    process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite",
  );
  assert.match(provider.lastRequest?.input ?? "", /2026-09-28/);
  assert.equal(
    provider.lastRequest?.jsonSchema.additionalProperties,
    false,
  );
}

assert.throws(
  () => parseIntentResponse("esto no es JSON"),
  (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
);

assert.throws(
  () =>
    parseIntentResponse(
      JSON.stringify({
        ...emptyResponse,
        intent: "create_task",
        title: null,
      }),
    ),
  (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
);

assert.throws(
  () =>
    parseIntentResponse(
      JSON.stringify({
        ...emptyResponse,
        intent: "create_task",
        title: "Fecha imposible",
        dueDate: "2026-02-31",
      }),
    ),
  (error) => error instanceof AiServiceError && error.code === "INVALID_RESPONSE",
);

assert.throws(
  () => new GeminiStructuredOutputProvider({ apiKey: "" }),
  (error) => error instanceof AiServiceError && error.code === "CONFIGURATION",
);

console.log(
  "Capa de IA verificada: 10 intents válidos y respuestas inseguras rechazadas.",
);
