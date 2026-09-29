export type StructuredOutputRequest = {
  model: string;
  systemInstruction: string;
  input: string;
  jsonSchema: Record<string, unknown>;
  maxOutputTokens?: number;
};

export interface StructuredOutputProvider {
  generateStructuredOutput(request: StructuredOutputRequest): Promise<string>;
}
