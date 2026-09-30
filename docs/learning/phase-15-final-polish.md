# Fase 15 — Pulido final

Esta fase no añade otro módulo de negocio. Su objetivo es convertir las catorce
fases anteriores en un MVP coherente, comprobable y más seguro para uso local.

## 1. Qué se auditó

La revisión siguió el recorrido completo de una operación:

```text
interfaz → validación → acción del servidor → servicio → repositorio → PostgreSQL
                         ↘ Gemini (interpretación, nunca autoridad)
```

Se revisaron arquitectura, navegación móvil, estados vacíos y de error,
validaciones, manejo de fallos de Gemini, índices de consultas, caché PWA,
cabeceras HTTP, secretos, código duplicado y documentación de instalación.

## 2. Seguridad y privacidad local

LifeOS todavía no tiene autenticación. Esa decisión es válida para un MVP
personal, pero significa que no debe escuchar en la red local ni publicarse en
Internet. Por eso `npm run dev` y `npm run start` fijan explícitamente
`127.0.0.1`.

`next.config.ts` añade una política CSP y cabeceras defensivas contra iframes,
sniffing de contenido, filtrado de referencias y permisos innecesarios. Estas
medidas reducen superficie de ataque, pero no sustituyen una futura capa de
autenticación.

Los metadatos también indican `noindex` y `nofollow`: una herramienta privada no
debe aparecer accidentalmente en buscadores.

## 3. PWA sin filtrar datos personales

La primera versión del service worker guardaba páginas como Inicio, Proyectos o
Inbox. Eso podía mostrar información privada antigua después de cerrar la app o
perder la red.

La política final es deliberadamente pequeña:

- las navegaciones usan siempre la red;
- solo se guardan `/offline`, el manifiesto y el icono;
- una actualización elimina las cachés anteriores;
- sin conexión se muestra una página genérica sin contenido personal.

La lección importante es que “funcionar offline” no siempre significa “cachear
todo”. En una aplicación privada, la confidencialidad y la frescura de los datos
son más importantes que renderizar una copia vieja.

## 4. Accesibilidad y responsive

La barra móvil tenía siete destinos comprimidos. Ahora conserva cuatro accesos
principales y agrupa Inbox, Revisiones y Crecimiento en “Más”. La versión de
escritorio mantiene todos los destinos visibles.

Los diálogos de texto, imagen y audio comparten un controlador accesible que:

- mueve el foco al contenido al abrir;
- mantiene la navegación con Tab dentro del diálogo;
- permite cerrar con Escape cuando no hay una operación pendiente;
- devuelve el foco al botón que abrió el diálogo;
- bloquea el scroll del documento mientras el diálogo está activo.

También existe un indicador global `focus-visible` y se respeta la preferencia
del sistema para reducir animaciones.

## 5. Rendimiento y mantenibilidad

La línea de tiempo filtra actividad por propietario y fecha. Se añadieron índices
compuestos para esos patrones en Project, Task, Idea, Note, Expense, Habit,
HabitLog y Goal. La migración queda versionada en `prisma/migrations/`.

El mensaje que transforma errores técnicos de Gemini en texto seguro para el
usuario vivía repetido en cinco Server Actions. Ahora está centralizado en
`src/lib/ai/user-error-message.ts`. También se eliminó un componente provisional
que ya no tenía consumidores.

## 6. Manejo de errores

Hay tres niveles complementarios:

- `error.tsx` recupera errores de una ruta y permite reintentar;
- `global-error.tsx` cubre un fallo del layout raíz;
- `not-found.tsx` ofrece un 404 consistente.

La ruta de descarga diferencia un identificador inválido de un error interno y
codifica correctamente nombres internacionales en `Content-Disposition`.

## 7. Cómo comprobar esta fase

Primero inicia PostgreSQL y ejecuta la verificación completa:

```powershell
npm run db:up
npm run verify
```

Después deja el servidor activo en una terminal:

```powershell
npm run dev
```

Y en otra terminal ejecuta:

```powershell
npm run ui:verify
```

La primera orden valida lint, TypeScript, build y todos los servicios. La segunda
comprueba rutas reales, 404, offline, cabeceras de seguridad y la política de
caché del service worker.

Pruebas manuales recomendadas:

1. Reduce el navegador a ancho móvil y abre “Más”.
2. Abre cada captura, recorre sus controles con Tab y ciérrala con Escape.
3. En DevTools, activa Offline y navega: debe aparecer la pantalla genérica.
4. Recarga conectado y confirma que tus datos provienen de PostgreSQL.

## 8. Qué queda fuera

El MVP queda terminado, pero no listo para exposición pública. Autenticación,
autorización multiusuario, despliegue, notificaciones, calendario, edición
offline y búsqueda vectorial son posibles evoluciones, no deuda oculta de esta
fase. Cualquiera debe empezar como una nueva decisión de producto y con sus
propias pruebas.
