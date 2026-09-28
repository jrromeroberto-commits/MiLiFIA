import "server-only";
import { db } from "@/lib/db/client";

const ownerEmail = process.env.LIFEOS_OWNER_EMAIL ?? "owner@lifeos.local";

export async function requireCurrentUser() {
  const user = await db.user.findUnique({ where: { email: ownerEmail } });

  if (!user) {
    throw new Error(
      "No existe el usuario principal. Ejecuta `npm run db:seed` y vuelve a intentarlo.",
    );
  }

  return user;
}
