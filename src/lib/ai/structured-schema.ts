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
        "list_ideas",
        "get_project_activity",
        "create_expense",
        "summarize_expenses",
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
      description:
        "Periodo solicitado para list_tasks o list_ideas; null si no se especifica. Para ideas solo usa TODAY, THIS_WEEK o ALL.",
    },
    projectStatus: {
      type: ["string", "null"],
      enum: ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "ALL", null],
      description: "Filtro para list_projects; null si no se especifica.",
    },
    amount: {
      type: ["number", "null"],
      description: "Monto positivo para create_expense; null para las demás intenciones.",
    },
    currency: {
      type: ["string", "null"],
      enum: ["PEN", null],
      description: "Moneda de create_expense. Esta fase solo admite soles peruanos (PEN).",
    },
    expenseCategory: {
      type: ["string", "null"],
      enum: [
        "FOOD",
        "TRANSPORT",
        "HOUSING",
        "SERVICES",
        "SOFTWARE",
        "HEALTH",
        "EDUCATION",
        "ENTERTAINMENT",
        "SHOPPING",
        "OTHER",
        null,
      ],
      description: "Categoría controlada para create_expense; OTHER si no hay una correspondencia segura.",
    },
    expenseDate: {
      type: ["string", "null"],
      format: "date",
      description: "Fecha YYYY-MM-DD del gasto; null para las demás intenciones.",
    },
    expenseTimeframe: {
      type: ["string", "null"],
      enum: ["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL", null],
      description: "Período solicitado para summarize_expenses.",
    },
    expenseAggregation: {
      type: ["string", "null"],
      enum: ["TOTAL", "BY_CATEGORY", null],
      description: "TOTAL para cuánto se gastó; BY_CATEGORY para en qué se gastó más.",
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
    "amount",
    "currency",
    "expenseCategory",
    "expenseDate",
    "expenseTimeframe",
    "expenseAggregation",
    "clarificationQuestion",
  ],
} as const;
