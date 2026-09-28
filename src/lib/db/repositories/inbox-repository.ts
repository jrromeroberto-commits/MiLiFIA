import "server-only";
import { db } from "@/lib/db/client";

export const inboxRepository = {
  list(userId: string) {
    return db.inboxItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};
