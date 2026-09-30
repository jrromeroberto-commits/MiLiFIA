# Fase 3 — Interfaz funcional conectada a PostgreSQL

## Qué cambia en esta fase

La Fase 2 demostró que la capa de datos funcionaba mediante scripts. La Fase 3
la conecta con pantallas reales manteniendo la misma frontera:

```text
Página de servidor ── lee mediante servicios ──► PostgreSQL
Formulario cliente ── llama Server Action ──► servicio ──► PostgreSQL
```

La interfaz nunca importa el cliente Prisma ni conoce `DATABASE_URL`.

## Server Components y Client Components

Las páginas de Inicio, Proyectos, detalle e Inbox son **Server Components**.
Consultan los servicios directamente en el servidor y envían HTML ya formado.

Solo los formularios son **Client Components**, porque necesitan mostrar el
estado “Guardando…”, conservar errores esperados y limpiar campos después de
una operación correcta. Esta frontera reduce el JavaScript enviado al
navegador.

## Recorrido de una creación

Al crear una tarea desde un proyecto:

1. `TaskCreateForm` reúne los campos del navegador.
2. `createTaskAction` recibe `FormData` mediante POST.
3. La acción obtiene el usuario actual en el servidor; nunca acepta `userId`
   desde el navegador.
4. `createTask` valida la entrada con Zod y comprueba que el proyecto pertenezca
   al usuario.
5. El repositorio ejecuta la operación Prisma.
6. `revalidatePath` solicita una versión fresca del inicio, proyectos y detalle.
7. React actualiza la interfaz y conserva el estado necesario.

## Dónde está cada pantalla

| Pantalla | Archivo principal | Fuente de datos |
| --- | --- | --- |
| Inicio | `src/app/page.tsx` | `dashboard-service.ts` |
| Proyectos | `src/app/projects/page.tsx` | `project-service.ts` |
| Detalle | `src/app/projects/[id]/page.tsx` | `getProjectDetail()` |
| Inbox | `src/app/inbox/page.tsx` | `inbox-service.ts` |

Las mutaciones viven en `src/app/actions/`. Los formularios reutilizables están
en `src/components/projects/` y los componentes visuales comunes en
`src/components/ui/`.

## Usuario actual

LifeOS sigue siendo una aplicación privada de un solo usuario. Por eso
`requireCurrentUser()` busca el correo configurado en `LIFEOS_OWNER_EMAIL`.
Esto no es un sistema de autenticación. Su propósito es evitar pasar un
`userId` manipulable desde el navegador y dejar un único punto para incorporar
autenticación real si el proyecto se vuelve multiusuario.

## Actividad reciente

Todavía no existe una entidad `Activity`. La actividad del proyecto se deriva
de `createdAt` y `completedAt` de tareas, ideas y notas. La UI lo indica
explícitamente para no prometer un historial que la base aún no conserva.
La vista global de actividad se incorpora en la Fase 14 mediante `/timeline`.

## Estados importantes

- `loading.tsx` presenta un esqueleto durante navegaciones con datos.
- `error.tsx` permite reintentar cuando falla PostgreSQL o el renderizado.
- `not-found.tsx` cubre proyectos inexistentes o identificadores inválidos.
- Los formularios usan `useActionState` para errores esperados y estados
  pendientes.
- Las listas vacías explican cuál será el siguiente paso útil.

## Cómo probar la fase

```bash
npm run db:up
npm run dev
```

Luego:

1. Crea un proyecto en `/projects`.
2. Abre su detalle y modifica nombre, descripción o estado.
3. Agrega una tarea, una idea y una nota.
4. Marca la tarea como completada.
5. Regresa a `/` y comprueba que las métricas sean reales.
6. Visita `/inbox` y confirma su estado vacío honesto.

Con el servidor de desarrollo activo, la prueba automatizada de rutas es:

```bash
npm run ui:verify
```

El script crea datos temporales, renderiza las páginas con esos datos y limpia
todo al finalizar.

## Preguntas para mejora continua

- ¿El formulario explica claramente qué ocurrió mientras espera?
- ¿Una pantalla vacía enseña el siguiente paso o solo dice “sin datos”?
- ¿Se envían al cliente más campos de los necesarios?
- ¿Cada Server Action vuelve a determinar el usuario y la propiedad del dato?
- ¿La operación actualiza todas las rutas que dependen de ella?
- ¿La interfaz distingue hechos almacenados de información derivada?
