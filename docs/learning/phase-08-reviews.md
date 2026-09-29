# Fase 8 — Resumen diario y semanal

Esta fase agrega dos rutas de revisión:

- `/review/daily`
- `/review/weekly`

Ambas se construyen primero con métricas deterministas obtenidas de PostgreSQL.
Gemini es una capa opcional de redacción: nunca decide los conteos ni sustituye
el reporte real.

## Flujo de datos

```text
PostgreSQL
   │
   ▼
reviewRepository.snapshot()
   │  registros del período y del usuario
   ▼
getReviewReport()
   │  reglas, conteos, prioridades y actividad
   ▼
UI diaria / semanal
   │
   └── bajo demanda ──► Gemini recibe solo métricas agregadas
```

No se creó una tabla de resúmenes. Cada revisión se calcula desde las tareas,
proyectos, ideas y notas actuales, evitando guardar información derivada que
podría quedar desactualizada.

## Definiciones del backend

### Revisión diaria

- **Tareas completadas:** `completedAt` pertenece al día actual en
  `America/Lima`.
- **Pendientes:** tareas en `TODO` o `IN_PROGRESS`.
- **Proyectos trabajados:** tuvieron un cambio en el proyecto, tarea, idea o
  nota durante el día.
- **Nuevas ideas:** `createdAt` pertenece al día actual.
- **Vencidas:** siguen pendientes y su `dueDate` es anterior a hoy.

### Revisión semanal

La semana va de lunes a domingo en `America/Lima`.

- **Tareas completadas:** terminaron dentro de esa semana.
- **Proyectos más activos:** se ordenan por la cantidad de tareas, ideas, notas
  y cambios del proyecto registrados durante el período.
- **Proyectos sin actividad:** están en estado `ACTIVE` y no tuvieron esos
  movimientos.
- **Nuevas ideas:** fueron creadas durante la semana.
- **Pendientes importantes:** continúan abiertas y tienen prioridad `HIGH`.

## Privacidad de la reflexión

La página funciona completamente sin llamar a Gemini. Solo al pulsar **Generar
reflexión** se ejecuta un Server Action que:

1. autentica nuevamente al usuario;
2. vuelve a calcular el reporte en el servidor;
3. extrae únicamente etiquetas y conteos agregados;
4. solicita a Gemini un JSON estructurado;
5. valida la respuesta con Zod.

No se envían títulos de tareas, proyectos, notas o ideas. Esto reduce exposición
de información personal y evita confiar en datos enviados por el navegador.

## Dónde está cada responsabilidad

- `src/lib/db/repositories/review-repository.ts`: consultas agrupadas del
  período.
- `src/services/review-service.ts`: reglas y DTO del reporte.
- `src/lib/time/calendar.ts`: límites UTC de días y semanas de Lima.
- `src/lib/ai/review-narrative-service.ts`: contrato seguro de la reflexión.
- `src/app/actions/review-actions.ts`: frontera autenticada para Gemini.
- `src/components/review/`: panel del reporte y estado interactivo de la IA.
- `src/app/review/daily/page.tsx`: revisión diaria.
- `src/app/review/weekly/page.tsx`: revisión semanal.

## Cómo probar

La prueba automática crea registros temporales, verifica las diez secciones,
comprueba un proyecto sin actividad y confirma que el prompt no contiene sus
nombres:

```bash
npm run review:verify
```

Para usar la interfaz:

```bash
npm run dev
```

Abre `/review/daily` o `/review/weekly`. Las métricas no consumen cuota. El botón
de reflexión sí realiza una solicitud real a Gemini.

## Mejora continua

El “nivel de actividad” actual es un conteo transparente, no una valoración de
productividad. Cuando exista la timeline de una fase posterior podrá basarse en
eventos explícitos. Hasta entonces, esta definición evita inferencias subjetivas
y puede explicarse registro por registro.

