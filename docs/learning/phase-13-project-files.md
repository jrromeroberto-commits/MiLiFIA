# Fase 13 — Archivos y búsqueda verificable

Esta fase permite adjuntar documentación a cada proyecto y encontrarla desde el
chat. El objetivo no es que Gemini “recuerde” documentos: el objetivo es que
LifeOS pueda demostrar de dónde salió cada coincidencia.

Ejemplo admitido:

> ¿Dónde está el documento relacionado con GLPI Cloud?

La respuesta contiene el nombre real del archivo, su proyecto, un fragmento
literal cuando existe texto indexado y un enlace de descarga.

## Decisión de arquitectura

Para este MVP privado y local se guardan juntos en PostgreSQL:

- los bytes originales del archivo (`BYTEA`);
- sus metadatos y hash SHA-256;
- el texto extraído;
- los fragmentos preparados para búsqueda y RAG futuro.

Esto da una operación atómica y simplifica copias de seguridad. En un despliegue
con muchos archivos conviene mover los bytes a almacenamiento de objetos y
conservar en PostgreSQL las referencias, permisos, hashes y fragmentos.

## Modelo de datos

`ProjectFile` pertenece a un usuario y a un proyecto. Conserva nombre, MIME,
tamaño, hash, bytes, estado de procesamiento y datos de extracción.

`ProjectFileChunk` divide el texto en fragmentos de unas 1 000 letras con un
pequeño solapamiento. Cada fragmento tiene posición y hash propios. Hoy se usa
búsqueda textual; después se puede añadir un vector de embedding al mismo
registro sin rediseñar la carga de archivos.

La restricción única `(projectId, sha256)` evita guardar dos veces el mismo
contenido dentro de un proyecto, aunque se intente con otro nombre.

La migración está en
`prisma/migrations/20260930044157_project_files/`.

## Flujo de carga

```text
Formulario del proyecto
  ↓
Server Action autenticada
  ↓
Límite de 8 MB + MIME + firma binaria
  ↓
SHA-256 y comprobación de duplicados
  ↓
Extracción local de texto
  ↓
Fragmentos con posición y hash
  ↓
Archivo y fragmentos guardados en PostgreSQL
```

Se admiten PDF, DOC, DOCX, TXT, JPG, PNG y WebP. TXT, PDF y DOCX se extraen
localmente. Las imágenes y el formato DOC antiguo se conservan como archivos
sin texto indexado; LifeOS no inventa OCR. También se aplican límites de 100
páginas, 15 segundos de extracción y un millón de caracteres.

## Flujo de búsqueda

Gemini solo selecciona la intención `search_files` y extrae `fileQuery` y el
proyecto mencionado. No recibe los archivos ni redacta una respuesta sobre su
contenido.

El backend elimina palabras genéricas, consulta nombres y fragmentos siempre
con `userId`, ordena las coincidencias y devuelve citas literales. Si no existe
una coincidencia, responde que no encontró nada. Esta separación impide que el
modelo presente como hecho un texto ausente.

La búsqueda actual es léxica, no semántica. Los fragmentos son la preparación
para una fase RAG posterior, donde se podrán calcular embeddings y recuperar
por similitud antes de pedir una respuesta con fuentes.

## Dónde está cada cosa

- `prisma/schema.prisma`: `ProjectFile`, `ProjectFileChunk` y estado de proceso.
- `src/lib/validation/project-file.ts`: límites y contratos de entrada.
- `src/lib/files/extractor.ts`: firmas y extracción local de PDF, DOCX y TXT.
- `src/lib/files/chunker.ts`: fragmentación y hash de cada sección.
- `src/lib/db/repositories/project-file-repository.ts`: acceso aislado a datos.
- `src/services/project-file-service.ts`: carga, deduplicación y descarga.
- `src/services/file-search-service.ts`: términos, ranking y citas.
- `src/app/actions/project-file-actions.ts`: carga y eliminación autenticadas.
- `src/app/files/[id]/download/route.ts`: descarga privada.
- `src/components/projects/project-file-section.tsx`: interfaz del proyecto.
- `src/lib/ai/intent-schema.ts`: contrato de `search_files`.
- `src/services/chat-tool-service.ts`: respuesta basada en resultados reales.
- `scripts/verify-files.ts`: prueba integral y autolimpiable.

## Cómo probar

```bash
npm run dev
```

1. Abre un proyecto.
2. En Archivos, sube un TXT que contenga “GLPI Cloud”.
3. Abre `/chat` y pregunta: “¿Dónde está el documento relacionado con GLPI Cloud?”.
4. Comprueba que el resultado incluye una cita real y descarga el original.

La prueba automática no usa Gemini ni consume cuota:

```bash
npm run files:verify
```

Comprueba carga, deduplicación, fragmentos, búsqueda, citas, límites y aislamiento
entre usuarios. Para revisar los datos manualmente puedes ejecutar:

```bash
npm run db:studio
```

## Mejora continua

- Añadir OCR explícito para imágenes y PDF escaneados, indicando su procedencia.
- Mover bytes a almacenamiento de objetos cuando el volumen lo justifique.
- Añadir antivirus y análisis asíncrono antes de servir archivos en producción.
- Incorporar `pgvector`, embeddings versionados y reindexación controlada.
- Construir respuestas RAG que citen archivo y fragmento y puedan abstenerse.
- Añadir búsqueda por etiquetas, fecha y tipo de archivo.

La regla que debe sobrevivir a todas estas mejoras es sencilla: una respuesta
sobre documentos solo puede afirmar aquello que pueda enlazar con una fuente
recuperada y visible.
