export type StructuredOutputRequest = {
  model: string;
  systemInstruction: string;
  input: string;
  image?: {
    data: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  jsonSchema: Record<string, unknown>;
  maxOutputTokens?: number;
};

export interface StructuredOutputProvider {
  generateStructuredOutput(request: StructuredOutputRequest): Promise<string>;
}
