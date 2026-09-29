# Fase 11 — Captura de audio

Esta fase permite hablar directamente a LifeOS o subir una nota de voz. Gemini
transcribe el audio y lo separa en borradores de tareas, ideas y notas. Ningún
elemento se guarda hasta que la persona revisa y confirma la propuesta.

## Flujo completo

```text
Micrófono o archivo de audio
  ▼
Vista previa y reproducción local
  ▼
Server Action autenticada
  ▼
Validación de tamaño, MIME y firma binaria
  ▼
Gemini recibe instrucción + audio inline
  ▼
JSON con transcripción y propuestas
  ▼
Zod valida nuevamente la respuesta
  ▼
Revisión de transcripción y borradores
  ▼
Confirmación explícita
  ▼
Guardado transaccional de los elementos seleccionados
```

## Dónde está cada pieza

- `src/components/chat/audio-capture-dialog.tsx`: interfaz para grabar, subir,
  reproducir, revisar y confirmar.
- `src/components/chat/use-audio-recorder.ts`: acceso al micrófono,
  `MediaRecorder`, selección de formato y límite de tres minutos.
- `src/app/actions/audio-capture-actions.ts`: frontera autenticada del servidor.
- `src/lib/validation/audio-capture.ts`: límite de 10 MB, formatos y firmas
  binarias.
- `src/lib/ai/audio-capture-prompt.ts`: reglas de transcripción y manejo de
  incertidumbre.
- `src/lib/ai/audio-capture-structured-schema.ts`: contrato JSON exigido a
  Gemini.
- `src/lib/ai/audio-capture-service.ts`: base64, llamada al proveedor y
  validación de respuesta.
- `src/lib/ai/gemini-provider.ts`: transforma el contrato interno en una
  entrada multimodal de tipo `audio`.
- `src/services/brain-dump-service.ts`: guarda únicamente los borradores que la
  persona confirmó.

## Grabación adaptable

Los navegadores no siempre graban en el mismo contenedor. El hook pregunta a
`MediaRecorder.isTypeSupported()` y prueba WebM con Opus, M4A/MP4 y OGG con
Opus. El formato realmente producido se conserva en el archivo enviado.

La grabación se detiene automáticamente a los tres minutos y usa una tasa de
64 kbit/s para mantener el archivo dentro de un tamaño razonable. También puede
detenerse manualmente. Al cerrar el diálogo se detiene el micrófono y se liberan
sus pistas.

## Seguridad del archivo

La aplicación acepta WebM, WAV, MP3/MPEG, M4A y OGG. El servidor no confía en
la extensión ni en el MIME declarado; examina las cabeceras EBML, RIFF/WAVE,
ID3 o frame sync, `ftyp` y `OggS` respectivamente.

El audio original se mantiene en memoria durante el análisis, se envía inline
a Gemini y no se almacena en PostgreSQL ni en el sistema de archivos. La
transcripción solo se presenta para revisión; los datos permanentes son los
borradores confirmados.

## Incertidumbre

Una palabra que no se entiende se representa como `[inaudible]`. Si existen dos
lecturas razonables, Gemini debe devolver un elemento `UNKNOWN` con una pregunta:

> El audio podría decir Carlos o Carla. ¿Cuál es correcto?

Los elementos `UNKNOWN` comienzan sin seleccionar. La persona debe aclararlos y
cambiar su tipo o dejarlos fuera. Además, Zod rechaza proyectos, respuestas sin
transcripción y borradores incompletos.

## Cómo probar

La prueba automática no consume cuota y usa bytes controlados junto a un
proveedor simulado:

```bash
npm run audio:verify
```

Para una prueba real:

```bash
npm run dev
```

Abre `/chat`, pulsa **Capturar audio** y di:

> Mañana tengo que revisar la tesis, terminar LifeOS y comprar un regalo.

Detén la grabación, reprodúcela y pulsa **Transcribir y revisar**. Confirma que
se muestran tres propuestas separadas antes de guardar. La prueba real utiliza
la clave configurada y consume cuota de Gemini.

## Mejora continua

- Mostrar una forma de onda durante la grabación.
- Permitir elegir el idioma esperado como pista opcional.
- Añadir vocabulario personal para nombres de proyectos o personas.
- Utilizar la Files API para audios largos en una fase posterior.
- Medir correcciones y descartes sin guardar el audio original.

La mejora no debe eliminar la confirmación humana ni convertir palabras
inaudibles en acciones permanentes.
