# Fase 1 — Fundamentos de LifeOS

## Qué aprendemos en esta fase

Una aplicación no empieza por la base de datos o la IA. Empieza por un entorno
repetible: cualquier persona debe poder descargarla, ejecutarla y comprobar que
funciona. Esta fase establece ese contrato.

## Cómo fluye una visita

1. El navegador solicita una URL, por ejemplo `/projects`.
2. Next.js encuentra `src/app/projects/page.tsx` por convención de carpetas.
3. `src/app/layout.tsx` envuelve la página con el layout compartido.
4. `AppShell` reserva el espacio principal y `Navigation` dibuja los accesos.
5. Tailwind y `globals.css` resuelven el aspecto responsive.
6. En el navegador, `PwaRegistration` registra `public/sw.js`.

La regla útil del App Router es: **una carpeta representa un segmento de URL y
un archivo `page.tsx` hace que ese segmento sea visitable**.

## Dónde modificar cada cosa

| Si quieres cambiar… | Ve a… |
| --- | --- |
| El contenido del inicio | `src/app/page.tsx` |
| Una página específica | `src/app/<ruta>/page.tsx` |
| Navegación de móvil/escritorio | `src/components/layout/navigation.tsx` |
| El marco común de todas las páginas | `src/components/layout/app-shell.tsx` |
| Colores, tarjetas y estilos globales | `src/app/globals.css` |
| Título, idioma y metadatos | `src/app/layout.tsx` |
| Datos de instalación PWA | `src/app/manifest.ts` |
| Comportamiento offline básico | `public/sw.js` |
| Variables configurables | `.env.example` y tu `.env.local` |

## Por qué hay componentes cliente y servidor

Las páginas son componentes de servidor por defecto: producen HTML sin enviar
JavaScript innecesario. `Navigation` usa `usePathname` para resaltar la ruta
actual y `PwaRegistration` usa una API del navegador; por eso ambos declaran
`"use client"`. Mantener esa frontera reduce el JavaScript descargado.

## Qué probar manualmente

1. Recorre `/`, `/chat`, `/projects` e `/inbox`.
2. Reduce el ancho del navegador: el menú lateral debe transformarse en una
   barra inferior cómoda para tocar.
3. Usa `Tab`: los enlaces deben recibir foco y ser utilizables sin ratón.
4. Para comprobar el PWA, ejecuta primero `npm run build` y `npm run start`.
   Después abre **Application → Manifest** y **Service Workers** en las
   herramientas del navegador. El service worker se omite deliberadamente en
   desarrollo para que el caché no oculte cambios mientras programas.
5. Ejecuta los tres controles: lint, TypeScript y build.

## Mejoras continuas, sin adelantar fases

Al revisar esta base, pregunta:

- ¿La acción principal se entiende en menos de cinco segundos?
- ¿La navegación sigue siendo cómoda con una sola mano?
- ¿Algún estilo se repite y merece convertirse en componente?
- ¿Se añadió JavaScript al navegador sin que hubiera interacción real?
- ¿Los textos de estado distinguen claramente demo, vacío, carga y error?

No implementamos aún las respuestas que dependen de otras fases. Las
registramos y las resolvemos cuando exista la capa correcta (datos en Fase 2,
UI funcional en Fase 3 e IA en Fase 4).
