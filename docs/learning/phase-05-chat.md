# Fase 5 — Chat de LifeOS

## Qué conecta esta fase

La Fase 4 terminaba en una intención validada. La Fase 5 toma esa intención,
selecciona una herramienta interna y permite que la capa de servicios lea o
modifique PostgreSQL.

```text
Chat del navegador
       │
       ▼
Server Action: valida entrada y obtiene el usuario
       │
       ▼
Gemini: clasifica y extrae datos
       │
       ▼
Zod: valida estructura y semántica
       │
       ▼
Ejecutor de herramientas: resuelve nombres y ambigüedad
       │
       ▼
Servicios con ownership → repositorios → PostgreSQL
       │
       ▼
DTO mínimo → respuesta natural en el chat
```

Gemini no recibe Prisma, identificadores internos ni acceso a la base de datos.
Solo propone uno de los ocho intents. El `switch` de
`executeLifeOSIntent()` decide qué función real puede ejecutarse.

## Ejemplo completo

Para el mensaje:

```text
Para LifeOS investigar notificaciones PWA mañana
```

ocurre lo siguiente:

1. El chat envía texto y hasta seis mensajes recientes a una Server Action.
2. La acción vuelve a obtener al usuario principal en el servidor.
3. Gemini propone `create_task`, título, proyecto y fecha.
4. Zod rechazaría cualquier salida fuera del contrato.
5. El ejecutor busca un proyecto cuyo nombre sea exactamente `LifeOS`, sin
   distinguir mayúsculas ni acentos.
6. Si existe uno solo, llama a `createTask()` con su `id` real.
7. El servicio comprueba ownership y Prisma guarda la tarea.
8. La acción invalida Inicio y Proyectos y retorna únicamente texto y un enlace
   seguro para la interfaz.

## Herramientas internas disponibles

| Intent | Herramienta ejecutada |
| --- | --- |
| `create_task` | `createTask()` |
| `create_project` | `createProject()` |
| `create_idea` | `createIdea()` |
| `create_note` | `createNote()` |
| `list_tasks` | `listTasks()` + filtros deterministas |
| `list_projects` | `listProjects()` + filtros deterministas |
| `complete_task` | búsqueda inequívoca + `updateTask()` |
| `unknown` | pregunta de aclaración; no ejecuta nada |

Los cálculos de hoy, mañana, esta semana y vencidas se realizan con código y
fechas reales. Gemini solamente selecciona el filtro solicitado.

## Manejo de incertidumbre

Hay dos barreras independientes:

- Gemini puede devolver `clarificationQuestion`; en ese caso el ejecutor se
  detiene antes de consultar o modificar datos.
- El backend vuelve a comprobar nombres contra PostgreSQL. Un proyecto ausente,
  varios proyectos equivalentes o varias tareas parecidas producen una pregunta
  y cero escrituras.

El modelo nunca decide un `projectId` ni un `taskId`. Estos identificadores salen
exclusivamente de consultas limitadas por `userId`.

## Conversación y persistencia

El navegador conserva hasta seis mensajes recientes como contexto. Esto permite
responder una aclaración sin guardar una entidad de conversación prematuramente.
El contexto se vuelve a validar, se limita a 2 000 caracteres por mensaje y se
trata como entrada no confiable.

Al recargar la página, la conversación desaparece. Las tareas, proyectos, ideas
y notas creadas sí permanecen en PostgreSQL. No se crean `InboxItem` por cada
mensaje porque duplicaría información que ya terminó clasificada.

## Dónde está cada cosa

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/chat/page.tsx` | Página de servidor y encabezado |
| `src/components/chat/chat-workspace.tsx` | Conversación, composer y estado temporal |
| `src/app/actions/chat-actions.ts` | Entrada POST segura y DTO de salida |
| `src/services/chat-service.ts` | Une interpretación y ejecución |
| `src/services/chat-tool-service.ts` | Herramientas, búsquedas y respuestas |
| `src/lib/validation/chat.ts` | Límites del mensaje y contexto |
| `scripts/verify-chat.ts` | Integración autolimpiable con PostgreSQL |

## Seguridad del flujo

- `GEMINI_API_KEY` solo se lee en módulos `server-only`.
- La Server Action se considera pública y vuelve a resolver el usuario.
- Todas las entradas del navegador se validan antes de llamar a Gemini.
- Los servicios existentes vuelven a validar tipos, ownership y proyectos.
- La respuesta al navegador no incluye registros Prisma completos.
- Las escrituras individuales se ejecutan directamente; varias acciones en un
  solo mensaje se rechazan hasta la pantalla de confirmación de la Fase 6.
- No hay reintentos automáticos de mutaciones, evitando duplicados accidentales.

## Cómo probarlo manualmente

```bash
npm run db:up
npm run dev
```

Abre `http://localhost:3000/chat` y prueba, una frase a la vez:

```text
Mañana revisar mi tesis
Crea un proyecto llamado CasaBalance
Tengo una idea para una aplicación de viajes
¿Qué tareas tengo pendientes?
¿Qué proyectos tengo activos?
Marca como terminada la tarea de revisar mi tesis
```

Comprueba en Inicio o Proyectos que las escrituras aparezcan realmente.

La prueba automatizada no usa cuota de Gemini. Inyecta intents conocidos, crea
datos temporales, recorre las ocho herramientas, comprueba PostgreSQL y elimina
todo al terminar:

```bash
npm run chat:verify
```

Para verificar solamente la interpretación real:

```bash
npm run ai:verify:live -- "Para LifeOS investigar notificaciones PWA mañana"
```

## Preguntas para mejora continua

- ¿Una frase ambigua se detiene antes de escribir?
- ¿Las coincidencias se resuelven con datos del usuario y no con memoria del modelo?
- ¿La respuesta confirma exactamente qué registro cambió?
- ¿El contexto reciente ayuda sin convertirse en una segunda base de datos?
- ¿Una caída de red puede hacer que el usuario repita una mutación?
- ¿Las listas siguen siendo rápidas cuando existan miles de tareas?

