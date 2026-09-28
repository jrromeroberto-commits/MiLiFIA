import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL es obligatoria para ejecutar el seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const ownerEmail = process.env.LIFEOS_OWNER_EMAIL ?? "owner@lifeos.local";
  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { name: "Usuario principal" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Usuario principal",
      email: ownerEmail,
    },
  });

  console.log(`Usuario principal listo: ${user.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
