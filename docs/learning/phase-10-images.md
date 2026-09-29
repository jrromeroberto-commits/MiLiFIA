# Fase 10 — Captura visual con Gemini

Esta fase permite convertir una fotografía en borradores de tareas, ideas y
notas. Los casos principales son pizarras, apuntes, capturas de pantalla y
listas manuscritas.

La regla central es la misma de la captura múltiple: **Gemini propone y la
persona confirma**. Analizar una imagen no escribe nada en PostgreSQL.

## Flujo completo

```text
Archivo elegido en el navegador
  ▼
Validación cliente: tipo y máximo 5 MB
  ▼
Server Action autenticada
  ▼
Validación servidor: tamaño, MIME y firma binaria real
  ▼
Gemini recibe texto + imagen inline y devuelve JSON estructurado
  ▼
Zod vuelve a validar cada propuesta
  ▼
Pantalla de revisión: editar, excluir o aclarar
  ▼
Confirmación explícita
  ▼
Servicio transaccional de la Fase 6 guarda los elementos elegidos
```

## Dónde está cada cosa

- `src/components/chat/image-capture-dialog.tsx`: selector, vista previa,
  revisión y confirmación.
- `src/app/actions/image-capture-actions.ts`: frontera autenticada entre el
  navegador y el servidor.
- `src/lib/validation/image-capture.ts`: formatos permitidos, máximo de 5 MB y
  comprobación de firmas JPEG, PNG y WebP.
- `src/lib/ai/image-capture-prompt.ts`: reglas contra invenciones y texto
  ilegible.
- `src/lib/ai/image-capture-structured-schema.ts`: contrato JSON enviado a
  Gemini.
- `src/lib/ai/image-capture-service.ts`: conversión a base64, llamada al
  proveedor y validación Zod de la respuesta.
- `src/lib/ai/provider.ts`: contrato de IA con una imagen opcional.
- `src/lib/ai/gemini-provider.ts`: transforma ese contrato en una entrada
  multimodal de la API de Gemini.
- `src/services/brain-dump-service.ts`: guardado final ya probado en la Fase 6.
- `next.config.ts`: permite hasta 6 MB en el cuerpo HTTP para dejar margen al
  multipart, manteniendo el límite del archivo en 5 MB.

## Por qué hay dos validaciones del archivo

El atributo `accept` del navegador mejora la experiencia, pero no es una
barrera de seguridad. Además, el campo MIME puede ser falso. El servidor revisa
los primeros bytes del archivo:

- PNG empieza con su firma de ocho bytes;
- JPEG empieza con `FF D8 FF`;
- WebP contiene `RIFF` y `WEBP` en posiciones definidas.

Solo después se codifica la imagen en base64. El nombre del archivo no se envía
a Gemini y la aplicación no guarda la imagen original.

## Cómo se evita asumir texto ilegible

El prompt ordena extraer únicamente texto visible. Cuando hay dos lecturas
posibles, Gemini debe crear un elemento `UNKNOWN` con una pregunta como:

> Este texto podría decir contrato o contacto. ¿Cuál es correcto?

Ese elemento aparece sin seleccionar. La persona puede excluirlo o cambiar su
tipo y completar los campos. El esquema del servidor exige una pregunta para
todo `UNKNOWN` y rechaza cualquier `PROJECT`, porque esta fase solo extrae
tareas, ideas y notas.

La instrucción al modelo no es la única defensa: el JSON se analiza y valida de
nuevo con Zod. Una salida con campos faltantes, fechas inválidas o tipos no
permitidos se rechaza antes de llegar a la interfaz.

## Cómo probar

La prueba local usa un proveedor simulado; no necesita imagen real, clave ni
cuota de Gemini:

```bash
npm run images:verify
```

Comprueba el payload base64, el contrato, la fecha local, una lectura ambigua,
la firma binaria, el límite y el rechazo de proyectos.

Para la prueba real:

```bash
npm run dev
```

Abre `/chat`, pulsa **Analizar imagen**, elige una foto y revisa cada propuesta.
La llamada real consume cuota de Gemini. Prueba deliberadamente una palabra
borrosa para confirmar que se presente una pregunta en vez de una suposición.

## Mejora continua

- Corregir orientación y perspectiva antes del envío para pizarras inclinadas.
- Añadir compresión local controlada para fotografías grandes.
- Permitir recortar una región y volver a analizar solo esa parte.
- Medir cuántas propuestas se corrigen o descartan para evaluar calidad sin
  almacenar las imágenes.
- Separar OCR y clasificación si se necesita trazabilidad carácter por carácter.

La prioridad para cualquier mejora sigue siendo conservar la revisión humana y
no convertir una lectura incierta en datos permanentes.
