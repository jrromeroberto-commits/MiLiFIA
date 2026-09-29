import "dotenv/config";

import { extractBrainDump } from "@/lib/ai/brain-dump-service";

const text =
  process.argv.slice(2).join(" ").trim() ||
  "Mañana revisar la tesis y pagar internet. También tengo una idea para una aplicación de viajes.";

const items = await extractBrainDump({ text });
console.log(JSON.stringify({ items }, null, 2));

