# LifeOS

LifeOS es una aplicación personal tipo “segundo cerebro”. Su promesa es simple:
**dime lo que tienes en la cabeza y yo lo organizo**.

El desarrollo avanza por fases deliberadamente pequeñas. La Fase 1 contiene
únicamente la base web, la navegación, una interfaz provisional y la
configuración PWA inicial. Los datos visibles son demostrativos; todavía no hay
base de datos ni inteligencia artificial.

## Ejecutar el proyecto

Necesitas Node.js 20.9 o superior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para comprobar la calidad
técnica de esta fase:

```bash
npm run lint
npx tsc --noEmit
npm run build
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
└── components/             Piezas de interfaz reutilizables
    ├── layout/              Shell y navegación responsive
    ├── placeholder-page.tsx
    └── pwa-registration.tsx
public/
└── sw.js                   Service worker básico
docs/
└── learning/               Explicaciones de cada fase
```

Consulta [la guía de la Fase 1](docs/learning/phase-01-foundation.md) para
entender cómo se conectan estas piezas y qué conviene observar antes de seguir.

## Principios de arquitectura

- La UI, el acceso a datos y la integración con IA tendrán límites claros.
- PostgreSQL será la fuente de verdad; Gemini solo interpretará y presentará.
- Toda acción sugerida por IA será validada en el backend.
- El MVP se mantendrá como una sola aplicación Next.js, sin microservicios.
- Cada fase debe conservar `lint`, TypeScript y `build` en verde.

## Variables de entorno

Copia `.env.example` como `.env.local` cuando necesites personalizar la
configuración. Nunca guardes claves reales en Git. Las credenciales de
PostgreSQL y Gemini se introducirán únicamente en las fases que las usan.
