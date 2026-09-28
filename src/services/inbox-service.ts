import "server-only";
import { inboxRepository } from "@/lib/db/repositories/inbox-repository";
import { entityIdSchema } from "@/lib/validation/common";

export function listInboxItems(userId: string) {
  return inboxRepository.list(entityIdSchema.parse(userId));
}
