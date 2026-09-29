export type IntentModelRequest = {
  model: string;
  systemInstruction: string;
  input: string;
  jsonSchema: Record<string, unknown>;
};

export interface IntentModelProvider {
  generateStructuredIntent(request: IntentModelRequest): Promise<string>;
}

