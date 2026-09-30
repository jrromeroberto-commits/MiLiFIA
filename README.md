# LifeOS

LifeOS es una aplicación personal tipo “segundo cerebro”. Su promesa es simple:
**dime lo que tienes en la cabeza y yo lo organizo**.

El MVP de 15 fases está completo. Incluye organización conversacional con Gemini,
proyectos, tareas, ideas, notas, Inbox, gastos, hábitos, metas, revisiones,
captura de texto, imagen y audio, archivos con búsqueda verificable y una línea
de tiempo personal. PostgreSQL conserva los hechos; Gemini interpreta lenguaje
natural, pero nunca escribe SQL ni modifica datos sin validación del backend.

> **Privacidad actual:** LifeOS es una aplicación local de un solo usuario y aún
> no tiene inicio de sesión. Los servidores de desarrollo y producción escuchan
> únicamente en `127.0.0.1`. No la publiques ni la expongas mediante un túnel sin
> implementar autenticación y autorización primero.

## Instalación desde cero

### Requisitos

- Node.js 22 o superior (`.nvmrc` fija la versión principal recomendada).
- npm, incluido con Node.js.
- Docker Desktop con Docker Compose.
- Una clave de Google AI Studio solo si usarás funciones reales de Gemini.

Desde PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
Copy-Item .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

En macOS o Linux, sustituye la copia del archivo por:

```bash
cp .env.example .env
```

Abre [http://localhost:3000](http://localhost:3000). El seed es reproducible:
puedes ejecutarlo nuevamente sin crear otro usuario principal.

Para usar el chat, las capturas y los resúmenes con IA, edita `.env` y añade tu
propia `GEMINI_API_KEY`. No necesitas esa clave para compilar ni para ejecutar
las verificaciones simuladas.

### Ejecución local optimizada

```powershell
npm run build
npm run start
```

Esto también queda limitado a `http://127.0.0.1:3000`.

## Verificación técnica

Con PostgreSQL iniciado, la comprobación principal ejecuta lint, TypeScript,
build y todas las pruebas de servicios autolimpiables:

```powershell
npm run verify
```

La verificación de interfaz necesita que `npm run dev` o `npm run start` siga
activo en otra terminal:

```powershell
npm run ui:verify
```

`ui:verify` comprueba las rutas principales, la página 404, el modo offline, las
cabeceras de seguridad y que el service worker no guarde páginas privadas. Las
pruebas con sufijo `:live` sí consumen cuota de Gemini y son opcionales.

## Cómo viaja una operación

```text
Navegador
  → Server Action / Route Handler
  → validación Zod
  → servicio de negocio
  → repositorio
  → Prisma
  → PostgreSQL

Gemini → JSON estructurado → validación Zod → herramienta interna autorizada
```

Los componentes no consultan Prisma directamente. Los cálculos financieros,
fechas, estados y permisos de propietario se resuelven en el backend. Los
archivos se sirven mediante una ruta privada y sus resultados de búsqueda citan
fragmentos almacenados, en lugar de permitir respuestas inventadas.

## Mapa rápido

```text
src/
├── app/                    Rutas, metadatos y estilos globales
│   ├── page.tsx            Inicio
│   ├── chat/page.tsx       Chat y acceso a “Vaciar mi cabeza”
│   ├── projects/page.tsx   Gestión funcional de proyectos
│   ├── projects/[id]/      Detalle funcional de proyecto
│   ├── inbox/page.tsx      Lista real de InboxItems
│   ├── review/              Revisión diaria y semanal
│   ├── growth/page.tsx     Hábitos, metas y progreso semanal
│   ├── timeline/page.tsx   Actividad diaria y semanal
│   ├── files/[id]/         Descarga privada de archivos
│   ├── offline/page.tsx    Respaldo PWA sin información personal
│   ├── actions/            Mutaciones seguras, incluido el chat
│   ├── layout.tsx          Layout raíz y metadatos
│   ├── error.tsx           Recuperación de errores de ruta
│   ├── global-error.tsx    Recuperación del documento raíz
│   ├── not-found.tsx       Estado 404 global
│   ├── manifest.ts         Manifiesto instalable PWA
│   └── globals.css         Sistema visual compartido
├── components/             Piezas de interfaz reutilizables
│   ├── forms/              Feedback y estados de envío
│   ├── layout/             Shell y navegación responsive
│   ├── projects/           Formularios y secciones de proyecto
│   ├── chat/               Conversación y capturas de texto, imagen y audio
│   ├── review/             Paneles y reflexión opcional
│   ├── growth/             Panel de hábitos y metas
│   └── ui/                 Componentes visuales compartidos
├── generated/prisma/       Cliente generado (ignorado por Git)
├── lib/
│   ├── ai/                 Gemini, intents y extracción de texto e imágenes
│   ├── db/                 Cliente y repositorios de PostgreSQL
│   ├── time/               Reglas de calendario en America/Lima
│   ├── files/              Extracción y fragmentación de documentos
│   └── validation/         Contratos de entrada con Zod
└── services/               Negocio, consultas, gastos, crecimiento y aislamiento
prisma/
├── schema.prisma           Modelos y relaciones
├── migrations/             Historial SQL versionado
└── seed.ts                 Usuario principal reproducible
scripts/
├── verify-crud.ts          Prueba integral y autolimpiable del CRUD
├── verify-ui.ts            Renderizado temporal de rutas con datos
├── verify-ai.ts            Contratos de IA sin red ni consumo de cuota
├── verify-gemini-live.ts   Consulta real opcional a Gemini
├── verify-chat.ts          Ocho intents contra PostgreSQL y autolimpieza
├── verify-brain-dump.ts    Lote confirmado y atómico con autolimpieza
├── verify-smart-queries.ts Cinco consultas de solo lectura y autolimpieza
├── verify-reviews.ts       Métricas diarias, semanales y privacidad de IA
├── verify-expenses.ts      Importes decimales, categorías y totales SQL
├── verify-image-capture.ts Imagen multimodal, firmas y contrato seguro
├── verify-audio-capture.ts Audio multimodal, transcripción y formatos
├── verify-growth.ts        Hábitos, metas y estadísticas autolimpiables
├── verify-files.ts         Archivos, búsqueda, citas y aislamiento
└── verify-timeline.ts      Actividad, zona horaria y aislamiento
public/
└── sw.js                   PWA con caché pública mínima y navegación por red
docs/
└── learning/               Explicaciones de cada fase
```

Consulta las guías de aprendizaje de la
[Fase 1](docs/learning/phase-01-foundation.md) y la
[Fase 2](docs/learning/phase-02-data-layer.md). La
[Fase 3](docs/learning/phase-03-functional-ui.md) explica cómo la interfaz lee y
modifica PostgreSQL sin exponer Prisma al navegador. La
[Fase 4](docs/learning/phase-04-gemini.md) recorre la interpretación estructurada,
la validación doble y el manejo de errores de Gemini. La
[Fase 5](docs/learning/phase-05-chat.md) explica cómo el chat convierte una
intención validada en una herramienta segura y una respuesta conversacional. La
[Fase 6](docs/learning/phase-06-brain-dump.md) recorre la captura múltiple, la
pantalla de confirmación y el guardado transaccional. La
[Fase 7](docs/learning/phase-07-intelligent-queries.md) explica cómo una pregunta
natural termina en filtros y cálculos confiables sobre PostgreSQL. La
[Fase 8](docs/learning/phase-08-reviews.md) documenta los balances diario y
semanal, además de la reflexión opcional con métricas agregadas. La
[Fase 9](docs/learning/phase-09-expenses.md) explica el modelo financiero, la
precisión decimal y las agregaciones seguras en PostgreSQL. La
[Fase 10](docs/learning/phase-10-images.md) recorre la carga segura de imágenes,
la entrada multimodal de Gemini y la confirmación antes de persistir. La
[Fase 11](docs/learning/phase-11-audio.md) explica la grabación adaptable, la
validación de audios y la revisión de la transcripción. La
[Fase 12](docs/learning/phase-12-growth.md) documenta los modelos de crecimiento,
las nuevas intenciones y las estadísticas calculadas en el backend. La
[Fase 13](docs/learning/phase-13-project-files.md) explica el almacenamiento,
la extracción local, los fragmentos y la búsqueda sin respuestas inventadas. La
[Fase 14](docs/learning/phase-14-personal-timeline.md) recorre las consultas,
la normalización de eventos y la agrupación horaria diaria/semanal. La
[Fase 15](docs/learning/phase-15-final-polish.md) documenta la auditoría final,
las decisiones de seguridad, accesibilidad, PWA y el proceso de verificación.

## Base de datos local

PostgreSQL se ejecuta en Docker sobre `127.0.0.1:5433`, separado del PostgreSQL
instalado en Windows. El volumen `lifeos_postgres_data` conserva la información
al detener el contenedor.

```bash
npm run db:up       # iniciar PostgreSQL
npm run db:stop     # detenerlo sin borrar datos
npm run db:status   # revisar migraciones
npm run db:studio   # explorar los registros visualmente
```

El contenedor usa autenticación `trust` exclusivamente para desarrollo local y
solo publica el puerto en loopback. Una base remota o de producción siempre
debe usar credenciales reales mediante variables de entorno.

## Principios de arquitectura

- La UI, el acceso a datos y la integración con IA tienen límites claros.
- PostgreSQL será la fuente de verdad; Gemini solo interpretará y presentará.
- Toda acción sugerida por IA será validada en el backend.
- El MVP se mantendrá como una sola aplicación Next.js, sin microservicios.
- Cada fase debe conservar `lint`, TypeScript y `build` en verde.

## Variables de entorno

Copia `.env.example` como `.env` cuando necesites reconstruir la configuración
local. Tanto `.env` como `.env.local` están ignorados por Git. Nunca guardes
claves reales en el repositorio: `DATABASE_URL` y `GEMINI_API_KEY` solo se leen
en capas marcadas para servidor.

Para probar Gemini de verdad, crea una clave en Google AI Studio, colócala
manualmente como `GEMINI_API_KEY` en `.env` y ejecuta:

```bash
npm run ai:verify:live -- "Mañana revisar mi tesis"
```

La prueba en vivo consume cuota. `npm run ai:verify` usa un proveedor simulado y
siempre puede ejecutarse sin clave.

## PWA y funcionamiento sin conexión

El manifiesto y el service worker permiten instalar la aplicación desde un
navegador compatible. Por privacidad, solo se guardan el manifiesto, el icono y
la página genérica `/offline`; las rutas personales (`/`, `/chat`, `/projects`,
etc.) siempre usan la red y nunca se persisten en la caché PWA. Sin conexión se
muestra una pantalla segura, no una copia potencialmente desactualizada de tus
datos.

## Límites conocidos del MVP

- No existe autenticación ni acceso remoto seguro.
- La búsqueda de archivos es textual; la arquitectura queda preparada para RAG,
  pero todavía no usa embeddings.
- No hay sincronización con calendario ni recordatorios en segundo plano.
- El modo offline informa la falta de conexión, pero no permite editar datos.
- La IA depende de la disponibilidad y cuota de la cuenta de Gemini configurada.

## Problemas frecuentes

- Si PostgreSQL no responde, abre Docker Desktop y ejecuta `npm run db:up`.
- Si una migración está pendiente, revisa `npm run db:status` y luego ejecuta
  `npm run db:migrate`.
- Si falta el cliente de Prisma, ejecuta `npm run db:generate`.
- Si Gemini rechaza una solicitud, verifica la clave y el modelo en `.env`; los
  datos existentes continúan disponibles aunque la IA esté temporalmente caída.
- `npm run db:stop` detiene PostgreSQL sin borrar el volumen ni tus datos.
