# Fase 7 — Consultas inteligentes

Esta fase permite hacer preguntas naturales sobre los datos reales de LifeOS:

- “¿Qué tengo que hacer hoy?”
- “¿Qué tareas tengo atrasadas?”
- “¿Qué proyectos tengo activos?”
- “¿Cuándo fue la última vez que avancé LifeOS?”
- “¿Qué ideas guardé esta semana?”

La palabra “inteligente” no significa que Gemini calcula la respuesta. Gemini
solo convierte la frase en una intención y filtros estructurados. El backend
aplica esos filtros sobre registros obtenidos de PostgreSQL.

## Flujo de una consulta

```text
Pregunta natural
      │
      ▼
Gemini interpreta intención y filtros
      │
      ▼
Zod valida el contrato
      │
      ▼
Herramienta interna resuelve usuario y proyecto
      │
      ▼
Servicio de consulta calcula fechas y actividad
      │
      ▼
PostgreSQL aporta los datos reales
      │
      ▼
Respuesta conversacional + enlaces
```

Gemini no recibe autoridad para consultar SQL, decidir qué registros existen o
calcular fechas. Si nombra un proyecto inexistente o ambiguo, el backend pide
aclaración.

## Intenciones nuevas

La Fase 4 tenía ocho intenciones. Ahora hay diez:

- `list_ideas`: consulta ideas por `TODAY`, `THIS_WEEK` o `ALL`, y puede limitar
  el resultado a un proyecto explícito.
- `get_project_activity`: busca la última actividad registrada de un proyecto.

Las consultas de tareas y proyectos ya existían, pero ahora el prompt contiene
reglas explícitas para reconocer hoy, vencidas, estados de proyecto e ideas por
periodo.

## Reglas que calcula el backend

### Tareas de hoy

Una tarea debe estar en `TODO` o `IN_PROGRESS` y su `dueDate` debe coincidir con
la fecha actual de `America/Lima`.

### Tareas atrasadas

Su fecha límite debe ser anterior a hoy y debe continuar pendiente. Una tarea
completada o cancelada no se presenta como atrasada.

### Ideas de esta semana

Se usa `createdAt`, porque la pregunta dice cuándo se guardó la idea. La semana
va de lunes a domingo según `America/Lima`.

### Último avance de un proyecto

Se compara `updatedAt` de:

- el proyecto;
- sus tareas;
- sus ideas;
- sus notas.

El registro más reciente determina la respuesta. Esto es una definición
reproducible con los modelos actuales. Una futura fase de timeline podrá
registrar eventos más detallados, pero no se anticipó aquí.

## Dónde está cada pieza

- `src/lib/ai/intent-schema.ts`: contratos Zod de las diez intenciones.
- `src/lib/ai/structured-schema.ts`: esquema JSON enviado a Gemini.
- `src/lib/ai/prompt.ts`: reglas lingüísticas de clasificación.
- `src/lib/time/calendar.ts`: fecha local, desplazamientos y semana común.
- `src/services/intelligent-query-service.ts`: filtros de ideas y cálculo de
  última actividad.
- `src/services/project-resolution-service.ts`: búsqueda exacta y manejo de
  proyectos inexistentes o ambiguos.
- `src/services/intelligent-query-tool-service.ts`: presenta las consultas
  nuevas como respuestas conversacionales seguras.
- `src/services/chat-tool-service.ts`: dirige cada intención a su herramienta.
- `src/components/chat/chat-workspace.tsx`: ejemplos visibles para probar.

## Cómo verificarlo

La prueba determinista crea registros temporales en PostgreSQL y ejecuta las
cinco consultas:

```bash
npm run queries:verify
```

Además comprueba que los conteos de proyectos, tareas, ideas y notas sean
idénticos antes y después de preguntar. Finalmente elimina los datos de prueba.

Para comprobar con Gemini real cómo clasifica las cinco frases de ejemplo:

```bash
npm run queries:verify:live
```

Esta segunda prueba requiere `GEMINI_API_KEY`, acceso a internet y consume cinco
solicitudes de la cuota.

Para probarlo manualmente:

```bash
npm run dev
```

Abre `/chat` y pulsa cualquiera de las frases sugeridas. También puedes escribir
variaciones naturales. La prueba real de interpretación requiere la clave de
Gemini configurada en `.env` y consume cuota.

## Mejora continua

Actualmente las consultas leen mediante los servicios existentes y filtran en
el backend, una solución sencilla y correcta para el MVP personal. Si el volumen
crece, el siguiente paso medible sería trasladar los filtros más frecuentes a
consultas Prisma paginadas e índices específicos. No se agrega esa complejidad
sin observar primero un problema real de rendimiento.
