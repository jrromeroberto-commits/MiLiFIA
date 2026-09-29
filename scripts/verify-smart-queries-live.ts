import "dotenv/config";

import { interpretLifeOSText } from "@/lib/ai/intent-service";

const examples = [
  "¿Qué tengo que hacer hoy?",
  "¿Qué tareas tengo atrasadas?",
  "¿Qué proyectos tengo activos?",
  "¿Cuándo fue la última vez que avancé LifeOS?",
  "¿Qué ideas guardé esta semana?",
];

for (const text of examples) {
  const intent = await interpretLifeOSText({ text });
  console.log(JSON.stringify({ text, intent }, null, 2));
}

