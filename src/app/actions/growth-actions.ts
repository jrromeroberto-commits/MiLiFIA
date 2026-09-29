"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { entityIdSchema } from "@/lib/validation/common";
import { completeGoal } from "@/services/growth-service";

export async function completeGoalAction(goalId: string) {
  const id = entityIdSchema.parse(goalId);
  const user = await requireCurrentUser();
  await completeGoal(user.id, id);
  revalidatePath("/growth");
}
