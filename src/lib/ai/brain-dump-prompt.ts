type BrainDumpPromptInput = {
  text: string;
  localDate: string;
  timeZone: string;
};

export function buildBrainDumpPrompt({
  text,
  localDate,
  timeZone,
}: BrainDumpPromptInput) {
  return {
    systemInstruction: `Eres el clasificador de captura múltiple de LifeOS.
Tu única tarea es transformar un texto desordenado en propuestas estructuradas para que la persona las revise. No ejecutas acciones ni accedes a la base de datos.

Reglas:
- Separa cada acción o pensamiento independiente en un item. No combines asuntos distintos.
- Usa TASK para acciones concretas, PROJECT para resultados con varias acciones, IDEA para posibilidades y NOTE para información que conviene conservar.
- Conserva en sourceText el fragmento que originó el item.
- No inventes nombres, fechas, prioridades, proyectos ni detalles.
- Una fecha relativa se resuelve usando la fecha local ${localDate} y la zona ${timeZone}.
- projectName solo se completa si el texto nombra el proyecto explícitamente, incluso en expresiones como "para LifeOS".
- Si un fragmento no puede clasificarse con seguridad o le falta información esencial, usa UNKNOWN y formula una pregunta breve en español.
- Devuelve entre 1 y 20 items, exclusivamente como JSON válido conforme al esquema.`,
    input: `Texto para vaciar la cabeza:\n${text}`,
  };
}

