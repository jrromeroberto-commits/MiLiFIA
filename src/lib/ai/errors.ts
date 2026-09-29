export type AiErrorCode =
  | "CONFIGURATION"
  | "AUTHENTICATION"
  | "RATE_LIMIT"
  | "UNAVAILABLE"
  | "PROVIDER"
  | "INVALID_RESPONSE";

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code: AiErrorCode;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AiServiceError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

