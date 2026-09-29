# Fase 12 — Hábitos y metas

Esta fase añade seguimiento personal sin convertir LifeOS en una aplicación de
salud compleja. El chat interpreta lo que ocurrió o lo que la persona quiere
conseguir; PostgreSQL conserva los registros y el backend calcula el progreso.

Ejemplos admitidos:

- “Hoy caminé 40 minutos.”
- “Quiero estudiar inglés cuatro veces por semana.”
- “Mi meta es terminar LifeOS este mes.”

## Modelo de datos

### Habit

Define una práctica recurrente:

- nombre y descripción opcional;
- período `DAILY` o `WEEKLY`;
- cantidad objetivo opcional;
- unidad, por ejemplo sesiones o minutos;
- estado activo.

El objetivo es opcional deliberadamente. Si la primera frase es “hoy caminé 40
minutos”, LifeOS crea `Caminar` medido en minutos, pero no inventa cuántos
minutos deberían caminarse por semana.

### HabitLog

Representa un avance real:

- usuario y hábito propietario;
- valor decimal;
- fecha local;
- nota opcional;
- fecha de creación.

Se permiten varios registros en un día porque una persona puede realizar más de
una sesión o registrar actividades separadas.

### Goal

Representa un resultado deseado:

- título y descripción opcional;
- fecha objetivo opcional;
- estado `ACTIVE`, `COMPLETED` o `CANCELLED`;
- fecha real de finalización.

La migración está en
`prisma/migrations/20260929052422_add_habits_and_goals/`.

## Intenciones nuevas

### create_habit

Extrae nombre, frecuencia, cantidad y unidad. “Cuatro veces por semana” se
convierte en cuatro sesiones semanales.

### log_habit

Extrae el hábito, la cantidad, la unidad y la fecha. Si el hábito no existe, el
backend puede crearlo sin objetivo y registrar el avance. Si ya existe con otra
unidad, LifeOS pide aclaración en vez de mezclar minutos, sesiones o kilómetros.

### create_goal

Extrae el resultado y el plazo explícito. Para “este mes”, Gemini propone el
último día del mes local y Zod valida que la fecha exista antes de guardarla.

Gemini nunca calcula estadísticas ni escribe directamente. Solo devuelve un
JSON que debe superar el contrato de `intent-schema.ts`.

## Flujo de una frase

```text
“Hoy caminé 40 minutos”
  ▼
Gemini propone log_habit
  ▼
Zod valida nombre, 40, MINUTES y fecha
  ▼
growth-tool-service resuelve o crea Caminar
  ▼
growth-service valida usuario y unidad
  ▼
growth-repository registra HabitLog
  ▼
PostgreSQL actualiza las estadísticas reales
```

## Estadísticas

La ruta `/growth` muestra:

- hábitos activos;
- registros de la semana actual;
- hábitos que alcanzaron su objetivo;
- metas activas;
- progreso semanal por hábito;
- último avance;
- listado de metas y su fecha objetivo.

Para una frecuencia diaria, el objetivo semanal simple es el objetivo diario
multiplicado por siete. Para hábitos en sesiones se cuentan registros; para
hábitos medidos en minutos, horas, kilómetros o páginas se suman los valores.
Todos los cálculos se realizan con código y consultas de PostgreSQL.

## Dónde está cada cosa

- `prisma/schema.prisma`: `Habit`, `HabitLog`, `Goal` y sus enums.
- `src/lib/validation/growth.ts`: contratos de entrada.
- `src/lib/db/repositories/growth-repository.ts`: consultas aisladas.
- `src/services/growth-service.ts`: propiedad, resolución y estadísticas.
- `src/services/growth-tool-service.ts`: ejecución de las tres intenciones.
- `src/lib/ai/intent-schema.ts`: validación de la respuesta de Gemini.
- `src/app/growth/page.tsx`: carga segura de la pantalla.
- `src/components/growth/growth-dashboard.tsx`: estadísticas y metas.
- `src/app/actions/growth-actions.ts`: finalización autenticada de una meta.

## Cómo probar

La migración ya fue aplicada durante la fase. En una reconstrucción del
proyecto se ejecuta con:

```bash
npm run db:migrate
```

La prueba automática crea hábitos, registra cinco avances, crea una meta,
comprueba cálculos y elimina todos los registros temporales:

```bash
npm run growth:verify
```

Para probar el lenguaje natural real:

```bash
npm run dev
```

Usa las tres frases del inicio en `/chat` y luego abre `/growth`. La prueba del
chat consulta Gemini y consume cuota; `growth:verify` usa intents simulados y no
consume cuota.

## Mejora continua

- Rachas basadas en días realmente cumplidos.
- Pausar o reactivar hábitos.
- Editar objetivos y unidades con historial de cambios.
- Gráficos mensuales y comparación entre períodos.
- Recordatorios, que pertenecen a una fase posterior.

Estas mejoras deben conservar una regla: no premiar volumen si el objetivo era
frecuencia diaria. La estadística semanal actual es deliberadamente simple y
queda documentada para poder evolucionarla conscientemente.
