export const brainDumpJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          itemType: {
            type: "string",
            enum: ["TASK", "PROJECT", "IDEA", "NOTE", "UNKNOWN"],
          },
          sourceText: { type: "string" },
          title: { type: ["string", "null"] },
          name: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          content: { type: ["string", "null"] },
          projectName: { type: ["string", "null"] },
          dueDate: { type: ["string", "null"], format: "date" },
          priority: {
            type: ["string", "null"],
            enum: ["LOW", "MEDIUM", "HIGH", null],
          },
          clarificationQuestion: { type: ["string", "null"] },
        },
        required: [
          "itemType",
          "sourceText",
          "title",
          "name",
          "description",
          "content",
          "projectName",
          "dueDate",
          "priority",
          "clarificationQuestion",
        ],
      },
    },
  },
  required: ["items"],
} as const;

