# Fase 2 — PostgreSQL, Prisma y capa de datos

## Qué aprendemos en esta fase

La base de datos es la fuente de verdad de LifeOS. La IA podrá proponer una
acción en fases posteriores, pero solo el backend validará y ejecutará esa
acción. Esta fase construye ese límite antes de conectar la interfaz.

## Recorrido de una operación

```text
Entrada desconocida
      │
      ▼
Servicio ── valida con Zod y aplica reglas de negocio
      │
      ▼
Repositorio ── delimita la consulta por userId
      │
      ▼
Prisma ── genera consultas tipadas y parametrizadas
      │
      ▼
PostgreSQL ── conserva datos, relaciones e índices
```

La UI nunca debe importar Prisma directamente. En la Fase 3 llamará a los
servicios, y estos seguirán siendo el único acceso permitido a los
repositorios.

## Dónde está cada responsabilidad

| Responsabilidad | Archivo o carpeta |
| --- | --- |
| Entidades, enums y relaciones | `prisma/schema.prisma` |
| Cambio SQL reproducible | `prisma/migrations/20260928052446_init/migration.sql` |
| Usuario inicial | `prisma/seed.ts` |
| Conexión reutilizable | `src/lib/db/client.ts` |
| Consultas Prisma | `src/lib/db/repositories/` |
| Validación de entradas | `src/lib/validation/` |
| Reglas y autorización por propietario | `src/services/` |
| Prueba de todos los CRUD | `scripts/verify-crud.ts` |
| PostgreSQL local | `docker-compose.yml` |

## Entidades y relaciones

Cada registro pertenece a un `User`. Una `Task`, `Idea` o `Note` puede estar
relacionada opcionalmente con un `Project`.

```text
User 1 ─── N Project
User 1 ─── N Task    N ─── 0..1 Project
User 1 ─── N Idea    N ─── 0..1 Project
User 1 ─── N Note    N ─── 0..1 Project
User 1 ─── N InboxItem
```

Si se elimina un proyecto, sus tareas, ideas y notas se conservan y quedan sin
proyecto (`SET NULL`). Si se elimina un usuario, se eliminan en cascada sus
datos, porque no pueden existir sin propietario.

`Task.dueDate` usa el tipo PostgreSQL `DATE`: representa un día del calendario
sin introducir una hora artificial. Los eventos de auditoría como `createdAt`
y `completedAt` sí usan `TIMESTAMPTZ`.

## Por qué hay servicios y repositorios

El repositorio sabe **cómo** consultar PostgreSQL. El servicio sabe **si** la
operación es válida. Por ejemplo, al crear una tarea relacionada con un
proyecto, el servicio comprueba primero que ese proyecto pertenezca al mismo
usuario. Esta separación evita dispersar reglas de seguridad por la UI.

Los módulos de datos importan `server-only`. Next.js producirá un error de
compilación si alguien intenta incluirlos accidentalmente en un componente de
navegador.

## Ciclo normal de una modificación de esquema

1. Edita `prisma/schema.prisma`.
2. Inicia PostgreSQL con `npm run db:up`.
3. Ejecuta `npm run db:migrate -- --name nombre_del_cambio`.
4. Revisa el SQL generado antes de compartirlo.
5. Ejecuta `npm run db:seed` y `npm run db:verify`.
6. Comprueba lint, TypeScript y build.

Nunca edites una migración que ya se aplicó en otros entornos. Crea una nueva.

## Cómo inspeccionar los datos

Ejecuta:

```bash
npm run db:studio
```

Prisma Studio abrirá un explorador local. Verás el usuario
`owner@lifeos.local`; el script de verificación elimina sus propios registros,
por lo que no deja proyectos o tareas de prueba.

## Decisiones de esta fase

- **PostgreSQL local en Docker:** no genera costos, es reproducible y no toca
  la instalación PostgreSQL ya presente en Windows.
- **Puerto 5433:** evita competir con el PostgreSQL de Windows en el 5432.
- **Prisma 7.10:** versión estable y soportada. Prisma 8 cambia el modelo de
  programación y su runtime PostgreSQL todavía se distribuye como candidato.
- **Nombres de proyecto únicos por usuario:** reduce duplicados y futuras
  ambigüedades en el chat.
- **UUID:** permite generar identificadores sin depender de contadores
  predecibles.

## Preguntas para mejora continua

- ¿Una nueva regla pertenece al esquema, al servicio o solo a la UI?
- ¿Todas las consultas incluyen `userId` para evitar acceso cruzado?
- ¿La entrada se valida antes de llegar al repositorio?
- ¿La migración protege los datos existentes?
- ¿El índice corresponde a una consulta real o es optimización prematura?
- ¿La prueba deja el entorno exactamente como lo encontró?
