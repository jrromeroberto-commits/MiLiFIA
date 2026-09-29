import type { LifeOSIntent } from "@/lib/ai/intent-schema";

export type ChatResultItem = {
  label: string;
  detail: string | null;
  href: string | null;
};

export type ChatToolResult = {
  intent: LifeOSIntent["intent"];
  outcome: "created" | "completed" | "answer" | "clarification";
  reply: string;
  items: ChatResultItem[];
  mutated: boolean;
};

