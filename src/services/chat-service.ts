import "server-only";

import {
  interpretLifeOSText,
  type InterpretLifeOSTextInput,
} from "@/lib/ai/intent-service";
import type { LifeOSIntent } from "@/lib/ai/intent-schema";
import {
  chatContextSchema,
  chatMessageSchema,
  type ChatContextMessage,
} from "@/lib/validation/chat";
import { executeLifeOSIntent } from "@/services/chat-tool-service";

type IntentInterpreter = (
  input: InterpretLifeOSTextInput,
) => Promise<LifeOSIntent>;

type ChatServiceDependencies = {
  interpret?: IntentInterpreter;
  context?: ChatContextMessage[];
};

export async function processChatMessage(
  userId: string,
  message: string,
  dependencies: ChatServiceDependencies = {},
) {
  const text = chatMessageSchema.parse(message);
  const context = chatContextSchema.parse(dependencies.context ?? []);
  const interpret = dependencies.interpret ?? interpretLifeOSText;
  const intent = await interpret({ text, context });

  return executeLifeOSIntent(userId, intent);
}
