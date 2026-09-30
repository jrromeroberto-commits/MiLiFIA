# Fase 14 — Timeline personal

Esta fase añade `/timeline`, una lectura cronológica de lo ocurrido en LifeOS.
Puede observarse un día concreto o la semana que contiene la fecha elegida.

Ejemplos de eventos:

- creaste un proyecto o una tarea;
- terminaste una tarea;
- guardaste una idea o nota;
- registraste un gasto o un avance de hábito;
- creaste o completaste una meta;
- agregaste un archivo.

## Decisión de arquitectura

La primera timeline se deriva de fechas que ya son fuente de verdad:
`createdAt` y `completedAt`. No se añadió una tabla ni se duplicaron eventos que
PostgreSQL ya puede reconstruir.

Esta decisión mantiene sencillo el MVP y permite mostrar actividad histórica
existente desde el primer momento. Tiene una limitación consciente: si se
elimina una entidad, desaparece también su evento; además, los cambios sucesivos
de nombre o estado no pueden reconstruirse porque solo existe el valor actual.

Una bitácora inmutable futura necesitaría un modelo como `ActivityEvent` o
`AuditLog`, escrito dentro de la misma transacción que cada operación. No se
añadió anticipadamente porque esta fase solo solicita actividad diaria/semanal.

## Flujo de datos

```text
/timeline?period=weekly&date=2026-09-30
  ↓
Validación de período y fecha
  ↓
Cálculo del intervalo en America/Lima
  ↓
Consultas paralelas, siempre filtradas por userId
  ↓
Normalización de entidades a TimelineEvent
  ↓
Orden descendente y agrupación por día local
  ↓
UI con horas, categorías, métricas y enlaces
```

Gemini no interviene. La timeline es una consulta determinista de PostgreSQL.

## Zona horaria

El usuario elige una fecha de calendario, pero `createdAt` y `completedAt` son
instantes UTC. `localDateRangeUtc()` convierte el inicio y final del día o semana
de Lima a un intervalo UTC antes de consultar.

Después, cada evento vuelve a agruparse con `localDateKey()`. Así, una actividad
registrada a las 23:40 en Lima sigue apareciendo en ese día aunque en UTC ya sean
las 04:40 del día siguiente.

## Dónde está cada cosa

- `src/lib/validation/timeline.ts`: contrato de período y fecha.
- `src/lib/db/repositories/timeline-repository.ts`: consultas por usuario y rango.
- `src/services/timeline-service.ts`: normalización, orden, grupos y métricas.
- `src/app/timeline/page.tsx`: lectura segura de parámetros y carga del usuario.
- `src/components/timeline/timeline-dashboard.tsx`: selector y línea de tiempo.
- `src/components/layout/navigation.tsx`: acceso desde la navegación principal.
- `scripts/verify-timeline.ts`: prueba integral y autolimpiable.

## Cómo probar

Inicia LifeOS:

```bash
npm run dev
```

1. Crea un proyecto, una tarea y una idea.
2. Completa la tarea o registra un gasto.
3. Abre `/timeline`.
4. Alterna entre **Día** y **Semana**.
5. Usa las flechas o el campo de fecha para recorrer otros períodos.

La prueba automática crea eventos con horas deterministas, verifica su orden,
comprueba el cambio de fecha UTC/Lima, prueba el aislamiento entre usuarios y
elimina los datos temporales:

```bash
npm run timeline:verify
```

## Mejora continua

- Crear una bitácora inmutable para conservar eventos de elementos eliminados.
- Registrar ediciones importantes con valor anterior y nuevo.
- Añadir filtros por tipo de evento o proyecto.
- Paginar períodos con una cantidad excepcionalmente alta de actividad.
- Permitir exportar una semana o un mes.

Estas mejoras deben mantener dos reglas: cada evento debe proceder de una acción
real y toda consulta debe permanecer aislada por `userId`.
