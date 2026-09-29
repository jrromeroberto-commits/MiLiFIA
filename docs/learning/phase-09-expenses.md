# Fase 9 — Gastos personales

Esta fase permite registrar y consultar gastos desde el chat:

- “Gasté 35 soles en almuerzo.”
- “Gasté 120 soles en hosting para Ultimate Stock.”
- “¿Cuánto gasté esta semana?”
- “¿En qué gasté más este mes?”

Gemini interpreta la frase, pero PostgreSQL almacena los importes y realiza
todas las sumas y agrupaciones.

## Modelo de datos

`Expense` contiene:

- `id`, `userId` y `projectId` opcional;
- `amount` como `Decimal(12,2)`;
- `currency`, inicialmente `PEN`;
- `description`;
- `category` controlada;
- `date`, `createdAt` y `updatedAt`.

Se guarda la moneda aunque esta fase solo admita soles. Esto evita que un monto
pierda su significado y permite rechazar otras monedas en vez de mezclarlas.

Las categorías iniciales son alimentación, transporte, vivienda, servicios,
software, salud, educación, entretenimiento, compras y otros. `OTHER` se usa
cuando no existe una correspondencia segura.

## Por qué el importe es Decimal

Los números binarios de JavaScript no representan exactamente muchos decimales.
Por eso:

1. Zod limita el importe a dos decimales.
2. El servicio lo convierte a una cadena decimal normalizada.
3. PostgreSQL lo almacena como `DECIMAL(12,2)`.
4. `SUM()` y `GROUP BY` trabajan con ese tipo exacto.

Convertir el resultado a `number` solo ocurre al final para aplicar el formato
visual `S/`, nunca para calcular el total.

## Intenciones nuevas

- `create_expense`: requiere monto, moneda, descripción, categoría y fecha;
  puede incluir un proyecto explícito.
- `summarize_expenses`: define un período y una agregación.

Períodos disponibles:

- `TODAY`
- `THIS_WEEK`
- `THIS_MONTH`
- `ALL`

Agregaciones:

- `TOTAL`: responde cuánto se gastó.
- `BY_CATEGORY`: identifica la categoría con mayor gasto y presenta el desglose.

Cuando el usuario registra un gasto sin fecha explícita, la regla de producto es
usar el día local actual de `America/Lima`. Una moneda diferente de PEN requiere
aclaración y no se guarda.

## Flujo de seguridad

```text
Mensaje
  ▼
Gemini extrae campos y filtros
  ▼
Zod valida el JSON
  ▼
expense-tool-service resuelve el proyecto
  ▼
expense-service valida usuario, monto y pertenencia
  ▼
expense-repository escribe o agrega en PostgreSQL
```

Gemini nunca recibe acceso a Prisma, no genera SQL y no calcula totales.

## Archivos principales

- `prisma/schema.prisma`: enum y modelo `Expense`.
- `prisma/migrations/20260929042511_add_expenses/`: migración SQL.
- `src/lib/validation/expense.ts`: contratos de importes y consultas.
- `src/lib/db/repositories/expense-repository.ts`: persistencia, `SUM()` y
  `GROUP BY`.
- `src/services/expense-service.ts`: reglas de moneda, fechas y propiedad.
- `src/services/expense-tool-service.ts`: respuestas conversacionales.
- `src/lib/ai/intent-schema.ts`: dos nuevas intenciones validadas.

## Cómo probar

La prueba automática registra dos gastos relacionados con un proyecto, verifica
el total exacto de `155.00`, comprueba la categoría principal y elimina los
registros temporales:

```bash
npm run expenses:verify
```

Para probar lenguaje natural real:

```bash
npm run dev
```

Abre `/chat` y usa las frases del inicio. Estas pruebas de chat sí consultan
Gemini y consumen cuota.

## Mejora continua

La fase actual utiliza una sola moneda para que los totales sean comparables.
Agregar dólares requeriría tipos de cambio y reglas de conversión verificables;
no se mezclan importes prematuramente. Una pantalla financiera dedicada tampoco
se añadió porque esta fase solicitó comandos conversacionales, no presupuestos
ni contabilidad completa.

