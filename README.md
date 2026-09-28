# LifeOS

LifeOS es una aplicación personal tipo “segundo cerebro”. Su promesa es simple:
**dime lo que tienes en la cabeza y yo lo organizo**.

El desarrollo avanza por fases deliberadamente pequeñas. Las Fases 1 y 2
establecen la base web y la capa de datos. Los datos visibles en la interfaz
siguen siendo demostrativos hasta conectar la UI en la Fase 3; todavía no hay
inteligencia artificial.

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
```

## Mapa rápido

```text
src/
├── app/                    Rutas, metadatos y estilos globales
│   ├── page.tsx            Inicio
│   ├── chat/page.tsx       Chat provisional
│   ├── projects/page.tsx   Proyectos provisional
│   ├── inbox/page.tsx      Inbox provisional
│   ├── layout.tsx          Layout raíz y metadatos
│   ├── manifest.ts         Manifiesto instalable PWA
│   └── globals.css         Sistema visual compartido
├── components/             Piezas de interfaz reutilizables
    ├── layout/              Shell y navegación responsive
    ├── placeholder-page.tsx
    └── pwa-registration.tsx
├── generated/prisma/       Cliente generado (ignorado por Git)
├── lib/
│   ├── db/                 Cliente y repositorios de PostgreSQL
│   └── validation/         Contratos de entrada con Zod
└── services/               Reglas de negocio y aislamiento por usuario
prisma/
├── schema.prisma           Modelos y relaciones
├── migrations/             Historial SQL versionado
└── seed.ts                 Usuario principal reproducible
scripts/
└── verify-crud.ts          Prueba integral y autolimpiable del CRUD
public/
└── sw.js                   Service worker básico
docs/
└── learning/               Explicaciones de cada fase
```

Consulta las guías de aprendizaje de la
[Fase 1](docs/learning/phase-01-foundation.md) y la
[Fase 2](docs/learning/phase-02-data-layer.md) para entender cómo se conectan
estas piezas y qué conviene observar antes de seguir.

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
local de Prisma. Tanto `.env` como `.env.local` están ignorados por Git. Nunca
guardes claves reales en el repositorio; `DATABASE_URL` solo está disponible en
la capa de servidor y `GEMINI_API_KEY` se agregará en la Fase 4.
