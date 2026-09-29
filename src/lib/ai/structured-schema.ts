export const lifeOSIntentJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: [
        "create_task",
        "create_project",
        "create_idea",
        "create_note",
        "list_tasks",
        "list_projects",
        "complete_task",
        "unknown",
      ],
      description: "La única intención principal expresada por el usuario.",
    },
    title: {
      type: ["string", "null"],
      description:
        "Título de tarea, idea o nota. Usa null cuando esa intención no lo requiera.",
    },
    name: {
      type: ["string", "null"],
      description: "Nombre de un proyecto nuevo; null para las demás intenciones.",
    },
    description: {
      type: ["string", "null"],
      description: "Descripción explícita, sin completar datos que el usuario no dio.",
    },
    content: {
      type: ["string", "null"],
      description: "Contenido de una nota; null para las demás intenciones.",
    },
    projectName: {
      type: ["string", "null"],
      description:
        "Nombre de proyecto mencionado explícitamente, incluso en frases como 'Para LifeOS'. No adivines referencias vagas.",
    },
    dueDate: {
      type: ["string", "null"],
      format: "date",
      description: "Fecha límite YYYY-MM-DD calculada con el contexto local proporcionado.",
    },
    priority: {
      type: ["string", "null"],
      enum: ["LOW", "MEDIUM", "HIGH", null],
      description: "Prioridad solo cuando el usuario la expresa o implica claramente.",
    },
    taskStatus: {
      type: ["string", "null"],
      enum: ["PENDING", "COMPLETED", "ALL", null],
      description: "Filtro para list_tasks; null si no se especifica.",
    },
    timeframe: {
      type: ["string", "null"],
      enum: ["TODAY", "TOMORROW", "THIS_WEEK", "OVERDUE", "ALL", null],
      description: "Periodo solicitado para list_tasks; null si no se especifica.",
    },
    projectStatus: {
      type: ["string", "null"],
      enum: ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "ALL", null],
      description: "Filtro para list_projects; null si no se especifica.",
    },
    clarificationQuestion: {
      type: ["string", "null"],
      description:
        "Pregunta breve en español si falta información esencial o hay ambigüedad; si no, null.",
    },
  },
  required: [
    "intent",
    "title",
    "name",
    "description",
    "content",
    "projectName",
    "dueDate",
    "priority",
    "taskStatus",
    "timeframe",
    "projectStatus",
    "clarificationQuestion",
  ],
} as const;
