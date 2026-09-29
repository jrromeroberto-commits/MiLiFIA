# Fase 4 — Gemini como intérprete seguro

## Objetivo de esta fase

Esta fase conecta LifeOS con Gemini, pero todavía no ejecuta acciones. La capa
de IA transforma una frase en una intención tipada que la Fase 5 podrá entregar
a los servicios de tareas, proyectos, ideas o notas.

```text
Texto del usuario
      │
      ▼
Prompt con fecha y zona horaria
      │
      ▼
Gemini + Structured Output (JSON Schema)
      │
      ▼
JSON.parse → Zod general → Zod específico por intent
      │
      ▼
Intención tipada (sin tocar PostgreSQL)
```

Gemini propone una interpretación. El backend conserva la autoridad porque
rechaza JSON mal formado, campos desconocidos, fechas imposibles y datos que no
cumplen el contrato de la intención.

## Decisiones técnicas

- Se usa `@google/genai`, el SDK oficial actual. El antiguo
  `@google/generative-ai` está en mantenimiento legado.
- El modelo predeterminado es `gemini-3.5-flash-lite`: es estable, admite
  Structured Outputs y encaja con clasificación/extracción de bajo costo.
- El proveedor usa la API de Interactions y su `response_format` actual, no los
  campos de salida estructurada ya marcados como obsoletos.
- `store: false` evita solicitar almacenamiento de la interacción en la API.
- El modelo y el proveedor son configurables para poder probar la lógica sin
  red, sin credenciales y sin consumir cuota.

Documentación oficial consultada:

- [SDK oficial de Gemini](https://ai.google.dev/gemini-api/docs/libraries)
- [Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Precios y nivel gratuito](https://ai.google.dev/gemini-api/docs/pricing)

## Los ocho intents

| Intent | Datos principales extraídos |
| --- | --- |
| `create_task` | título, descripción, proyecto, fecha, prioridad |
| `create_project` | nombre, descripción |
| `create_idea` | título, descripción, proyecto |
| `create_note` | título opcional, contenido, proyecto |
| `list_tasks` | estado, periodo, proyecto |
| `list_projects` | estado |
| `complete_task` | título de la tarea, proyecto |
| `unknown` | pregunta de aclaración |

La salida transportada por Gemini usa todos los campos con `null` cuando no
aplican. Después, `toLifeOSIntent()` reduce ese objeto a un contrato específico.
Así, una intención `create_project` no llega al resto del sistema cargando
campos de tarea o nota.

## Dónde está cada parte

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/ai/gemini-provider.ts` | Único contacto con el SDK y la clave de Gemini |
| `src/lib/ai/structured-schema.ts` | JSON Schema enviado a Gemini |
| `src/lib/ai/intent-schema.ts` | Validación Zod general y específica por intent |
| `src/lib/ai/prompt.ts` | Reglas contra invención y contexto de fecha |
| `src/lib/ai/intent-service.ts` | Orquesta proveedor, parseo y validación |
| `src/lib/ai/provider.ts` | Interfaz intercambiable para Gemini o pruebas |
| `src/lib/ai/errors.ts` | Errores seguros y clasificación de reintentos |
| `scripts/verify-ai.ts` | Prueba sin red de intents y respuestas inválidas |
| `scripts/verify-gemini-live.ts` | Prueba opcional contra la API real |

`server-only` protege los archivos que acceden al SDK y a variables de entorno:
si un Client Component intenta importarlos, Next.js detiene la compilación.

`store: false` reduce el almacenamiento solicitado a la API, pero no reemplaza
los términos de tratamiento de datos del proveedor. La tabla oficial de precios
indica actualmente que el contenido del nivel gratuito puede utilizarse para
mejorar productos de Google, mientras que el nivel de pago figura como no usado
para ese fin. Como LifeOS manejará datos personales, conviene no enviar
información altamente sensible al nivel gratuito sin revisar primero esos
términos vigentes.

## Fechas y ambigüedad

El backend agrega al prompt la fecha local actual y `America/Lima`. Por eso
Gemini puede convertir “mañana” en `YYYY-MM-DD` sin depender de la zona horaria
de sus servidores. Zod comprueba además que la fecha exista realmente; por
ejemplo, rechaza `2026-02-31`.

La pregunta `clarificationQuestion` permite indicar incertidumbre. Gemini tiene
la regla explícita de no adivinar referencias como “el proyecto”. En la Fase 5,
el backend también deberá consultar PostgreSQL y confirmar que un nombre
corresponda inequívocamente a un registro antes de ejecutar nada.

## Errores previstos

`AiServiceError` distingue configuración ausente, credencial rechazada, límite
de cuota, indisponibilidad del proveedor y respuesta inválida. Los límites y
fallos temporales quedan marcados como reintentables, pero esta fase no agrega
reintentos automáticos para evitar duplicar futuras acciones.

Los mensajes de error no incluyen la respuesta cruda de Gemini ni la clave.

## Configurar y probar

Primero crea una clave en Google AI Studio y agrégala manualmente al `.env`:

```dotenv
GEMINI_API_KEY=tu_clave_real
GEMINI_MODEL=gemini-3.5-flash-lite
```

Nunca copies la clave a `.env.example` ni a un archivo versionado.

La verificación segura y sin consumo de API es:

```bash
npm run ai:verify
```

Comprueba los ocho intents y confirma que LifeOS rechaza JSON inválido, datos
esenciales ausentes y fechas imposibles.

Cuando la clave ya exista, una consulta real opcional es:

```bash
npm run ai:verify:live -- "Para LifeOS investigar notificaciones PWA mañana"
```

Ese comando sí usa la cuota de Gemini. Solo imprime la interpretación; no crea
ningún registro en PostgreSQL.

## Preguntas para mejora continua

- ¿Cada dato devuelto estaba presente en el mensaje o fue inventado?
- ¿Las frases relativas producen la fecha correcta en `America/Lima`?
- ¿Una ambigüedad genera una pregunta útil en vez de una elección arbitraria?
- ¿El contrato Zod rechaza una salida aparentemente válida pero incoherente?
- ¿Los nuevos intents pueden agregarse sin mezclar IA con acceso a datos?
- ¿Los errores reintentables se manejan sin repetir una acción ya ejecutada?
