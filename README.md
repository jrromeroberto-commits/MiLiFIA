# LifeOS

LifeOS es una aplicación personal tipo “segundo cerebro”. Su promesa es simple:
**dime lo que tienes en la cabeza y yo lo organizo**.

El desarrollo avanza por fases deliberadamente pequeñas. Las Fases 1 a 5
establecen la base web, la capa de datos, una interfaz funcional, el intérprete
de Gemini y un chat que ejecuta herramientas internas validadas contra
PostgreSQL.

## Ejecutar el proyecto

Necesitas Node.js 20.19 o superior y Docker Desktop.

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para comprobar la calidad
técnica de esta fase:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run db:verify
npm run ui:verify
npm run ai:verify
npm run chat:verify
```

## Mapa rápido

```text
src/
├── app/                    Rutas, metadatos y estilos globales
│   ├── page.tsx            Inicio
│   ├── chat/page.tsx       Chat funcional con lenguaje natural
│   ├── projects/page.tsx   Gestión funcional de proyectos
│   ├── projects/[id]/      Detalle funcional de proyecto
│   ├── inbox/page.tsx      Lista real de InboxItems
│   ├── actions/            Mutaciones seguras, incluido el chat
│   ├── layout.tsx          Layout raíz y metadatos
│   ├── manifest.ts         Manifiesto instalable PWA
│   └── globals.css         Sistema visual compartido
├── components/             Piezas de interfaz reutilizables
│   ├── forms/              Feedback y estados de envío
│   ├── layout/             Shell y navegación responsive
│   ├── projects/           Formularios y secciones de proyecto
│   ├── chat/               Conversación y compositor
│   └── ui/                 Componentes visuales compartidos
├── generated/prisma/       Cliente generado (ignorado por Git)
├── lib/
│   ├── ai/                 Gemini, prompts y contratos de intents
│   ├── db/                 Cliente y repositorios de PostgreSQL
│   └── validation/         Contratos de entrada con Zod
└── services/               Reglas de negocio y aislamiento por usuario
prisma/
├── schema.prisma           Modelos y relaciones
├── migrations/             Historial SQL versionado
└── seed.ts                 Usuario principal reproducible
scripts/
├── verify-crud.ts          Prueba integral y autolimpiable del CRUD
├── verify-ui.ts            Renderizado temporal de rutas con datos
├── verify-ai.ts            Contratos de IA sin red ni consumo de cuota
├── verify-gemini-live.ts   Consulta real opcional a Gemini
└── verify-chat.ts          Ocho intents contra PostgreSQL y autolimpieza
public/
└── sw.js                   Service worker básico
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
intención validada en una herramienta segura y una respuesta conversacional.

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

- La UI, el acceso a datos y la integración con IA tendrán límites claros.
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
