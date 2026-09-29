# Fase 6 — Vaciar mi cabeza

Esta fase convierte un texto largo y desordenado en varias propuestas que la
persona puede revisar antes de guardar. La diferencia importante frente al chat
de la Fase 5 es que aquí **Gemini no ejecuta una intención individual**: produce
un lote de borradores.

## Recorrido completo

```text
Texto largo
   │
   ▼
Server Action de análisis ──► Gemini ──► JSON estructurado ──► Zod
                                                        │
                                                        ▼
                                              Modal de confirmación
                                              editar / excluir / cancelar
                                                        │
                                               Guardar todo o selección
                                                        ▼
Server Action de guardado ──► Zod ──► prevalidación ──► transacción PostgreSQL
```

El primer Server Action no escribe en la base de datos. Solamente valida el
texto, pide la clasificación y devuelve DTOs serializables al navegador. La
escritura sucede únicamente cuando se pulsa **Guardar todo** o **Guardar
seleccionados**.

## Dónde está cada responsabilidad

- `src/components/chat/brain-dump-dialog.tsx`: estados de captura, revisión y
  resultado; permite editar, excluir o cancelar propuestas.
- `src/app/actions/brain-dump-actions.ts`: frontera pública del servidor. Vuelve
  a comprobar usuario y entradas porque un Server Action puede invocarse sin
  pasar por la interfaz.
- `src/lib/ai/brain-dump-prompt.ts`: instrucciones que separan pensamientos y
  prohíben inventar datos.
- `src/lib/ai/brain-dump-structured-schema.ts`: contrato JSON que Gemini debe
  responder.
- `src/lib/ai/brain-dump-service.ts`: llamada a Gemini y segunda validación de
  su respuesta con Zod.
- `src/lib/validation/brain-dump.ts`: contratos compartidos para análisis,
  edición y confirmación.
- `src/services/brain-dump-service.ts`: reglas del lote y transacción atómica.

## Por qué hay dos validaciones

El esquema JSON orienta la salida del modelo, pero no convierte a Gemini en una
fuente confiable. Zod verifica nuevamente tipos, límites, fechas reales y campos
obligatorios. Al guardar se valida otra vez, porque el usuario pudo editar los
datos en el navegador y cualquier cliente podría llamar directamente al Server
Action.

Un item `UNKNOWN` es válido durante la revisión: representa una ambigüedad y
muestra la pregunta de Gemini. No es válido al guardar. Debe cambiarse a un tipo
con datos completos o quedar sin seleccionar.

## Guardado atómico

Antes de escribir, el servicio comprueba todos los nombres de proyecto. Una
tarea, idea o nota puede apuntar a un proyecto existente o a uno incluido en el
mismo lote. Si el proyecto falta o hay nombres equivalentes ambiguos, no se
guarda nada.

PostgreSQL ejecuta las escrituras en una sola transacción:

1. Crea primero los proyectos nuevos.
2. Resuelve sus identificadores.
3. Crea tareas, ideas y notas.
4. Confirma todo junto; ante un error revierte todo.

Esto evita el caso peligroso de guardar dos propuestas y perder las siguientes.
PostgreSQL continúa siendo la fuente de verdad; el texto y los borradores viven
solo mientras el modal está abierto.

## Cómo probar esta fase

Prueba determinista, sin red ni cuota de Gemini:

```bash
npm run brain-dump:verify
```

Esta prueba valida el contrato de IA con un proveedor simulado, crea un proyecto,
una tarea, una idea y una nota reales, comprueba sus relaciones, prueba un
proyecto faltante y elimina los registros temporales.

Prueba opcional con Gemini real:

```bash
npm run brain-dump:verify:live -- "Mañana revisar la tesis, pagar internet y tuve una idea para una aplicación de viajes"
```

La prueba en vivo requiere `GEMINI_API_KEY` y consume cuota. Para la aplicación
completa:

```bash
npm run dev
```

Abre `/chat`, pulsa **Vaciar mi cabeza**, escribe varios asuntos, revisa las
propuestas y confirma. Comprueba luego la portada o el proyecto correspondiente.

## Mejoras continuas que ya quedan visibles

- Medir cuántos items terminan editándose ayudaría a mejorar el prompt sin dar
  más autoridad al modelo.
- Una futura fase puede guardar borradores abandonados en Inbox, pero no se hizo
  aquí porque cambiaría la semántica: cancelar actualmente significa no guardar.
- Si el número máximo crece, convendrá dividir capturas muy extensas en bloques;
  esta fase limita cada respuesta a 20 propuestas para mantener una revisión
  humana manejable.

