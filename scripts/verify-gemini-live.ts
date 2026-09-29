import "dotenv/config";

import { interpretLifeOSText } from "@/lib/ai/intent-service";

const text = process.argv.slice(2).join(" ").trim() || "Mañana revisar mi tesis";

if (!process.env.GEMINI_API_KEY?.trim()) {
  throw new Error(
    "Falta GEMINI_API_KEY en .env. Agrégala manualmente antes de ejecutar esta prueba.",
  );
}

const result = await interpretLifeOSText({ text });
console.log(JSON.stringify(result, null, 2));

