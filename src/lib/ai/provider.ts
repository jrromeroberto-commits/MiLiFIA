export type StructuredOutputRequest = {
  model: string;
  systemInstruction: string;
  input: string;
  image?: {
    data: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  audio?: {
    data: string;
    mimeType:
      | "audio/webm"
      | "audio/wav"
      | "audio/mpeg"
      | "audio/m4a"
      | "audio/ogg";
  };
  jsonSchema: Record<string, unknown>;
  maxOutputTokens?: number;
};

export interface StructuredOutputProvider {
  generateStructuredOutput(request: StructuredOutputRequest): Promise<string>;
}
