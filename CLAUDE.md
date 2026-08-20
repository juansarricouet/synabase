# CLAUDE.md

Guía para asistentes de IA que trabajan en este repositorio. Complementa a
[README.md](README.md) (qué es el producto y qué hace cada módulo) y a
[DEPLOY.md](DEPLOY.md) (cómo se pone online y qué configura cada variable de
entorno). **Este archivo cubre lo que no está ahí: cómo está armado el código y
qué convenciones respetar al tocarlo.**

## Qué es SynapBase

SaaS multi-tenant para comercios (Argentina). Un QR en el local lleva a una
encuesta corta; el cliente responde a cambio de un descuento y cada respuesta
alimenta la base de clientes del comercio: visitas, producto favorito,
frecuencia, gasto. Sobre esa base el comercio segmenta y arma campañas de
WhatsApp/Email. **El descuento es el incentivo; la información es el producto.**

Un solo proyecto Next.js sirve todo: landing pública, blog, panel autenticado,
panel de demostración sin base de datos, formulario público del QR y panel
interno de administración.

## Comandos

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # build de producción (funciona SIN DATABASE_URL)
npm start
npm run typecheck   # tsc --noEmit — es la única verificación automática que hay
npm run db:setup    # crea/actualiza las tablas; idempotente
npm run seed        # comercio demo "Café Martina" en la base real
```

**No hay tests, ni ESLint configurado, ni CI.** `next.config.ts` tiene
`eslint: { ignoreDuringBuilds: true }`. Antes de dar por terminado un cambio,
corré **`npm run typecheck` y `npm run build`** — es la red de seguridad
disponible y ambos tienen que pasar limpios.

`db:setup` y `seed` cargan `.env.local` y `.env` con
`--env-file-if-exists`; no hay que exportar nada a mano.

## Mapa del repositorio

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx  en/page.tsx # Landing bilingüe (es / en)
│   ├── blog/                 # Blog público (contenido en src/lib/blog.ts)
│   ├── (auth)/               # /login /register
│   ├── onboarding/           # Alta del comercio
│   ├── f/[slug]/             # Formulario público del QR
│   ├── invite/[token]/       # Aceptar invitación de equipo
│   ├── app/                  # Panel autenticado (8 secciones)
│   ├── demo/                 # Espejo del panel, sin sesión ni base de datos
│   ├── admin/                # Panel interno (pagos y planes)
│   ├── api/                  # Rutas REST
│   └── globals.css           # Tema de Tailwind 4 + utilidades propias
├── components/
│   ├── ui/                   # Kit propio: Button, Input, Modal, Toast, Badge…
│   ├── shell/                # AppShell (sidebar) y PageHeader
│   ├── views/                # Vistas compartidas entre /app y /demo
│   ├── landing/              # Landing, animaciones y mocks
│   └── demo/DemoMode.tsx     # Contexto que marca el subárbol como demo
├── lib/                      # Código que corre en el navegador y/o el servidor
│   ├── types.ts              # Tipos de dominio compartidos front ⇄ back
│   ├── plans.ts              # Planes, precios y cupos (fuente única)
│   ├── client.ts             # api(): cliente HTTP de la API interna
│   ├── answer-validation.ts  # Validación de respuestas (corre en ambos lados)
│   ├── utils.ts export.ts blog.ts landing-copy.ts contact.ts
└── server/                   # Backend. Todo lleva import "server-only"
    ├── db.ts                 # Pool de pg + helpers rows/one/run/tx + fechas AR
    ├── schema.mjs            # Esquema SQL: fuente única (runtime + seed)
    ├── auth.ts               # scrypt, sesiones y getTenant()
    ├── guard.ts http.ts      # requireTenant / withTenant / ApiError / zod
    ├── plan-limits.ts        # Qué habilita cada plan
    ├── rate-limit.ts log.ts notify.ts billing-config.ts admin-guard.ts
    ├── demo-data.ts          # Café Martina en memoria (alimenta /demo)
    ├── demo-seed.mjs         # Café Martina en PostgreSQL (alimenta npm run seed)
    └── services/             # TODO el SQL vive acá
```

Alias de importación: `@/*` → `./src/*`.

`synapbasepostgres.zip` y `.tar.gz` en la raíz son subidas manuales viejas
(commit "Add files via upload"). No forman parte del build; no los toques ni los
uses como referencia.

## Reglas que no se negocian

### 1. Aislamiento multi-tenant

Toda tabla de datos lleva `business_id`. **El tenant sale siempre de la sesión,
nunca del cliente.**

- Páginas del panel: `const tenant = await requireTenant()` (`src/server/guard.ts`).
- Rutas de API: `export const POST = withTenant(async (tenant, req) => …)`.
- Toda función de servicio recibe `businessId` como primer parámetro y **filtra
  por él en el `WHERE`**, incluso cuando ya se filtró por un id propio del
  negocio. El acceso cruzado tiene que responder 404/401, nunca datos ajenos.

Nunca aceptes un `businessId` que venga del cuerpo, la query o los params.

### 2. El SQL vive en `src/server/services/*`

Los servicios hablan con la base únicamente por los cuatro helpers de
`src/server/db.ts`:

| Helper | Para qué |
|---|---|
| `rows<T>(sql, params?, runner?)` | Todas las filas |
| `one<T>(sql, params?, runner?)` | La primera o `undefined` |
| `run(sql, params?, runner?)` | Escritura; devuelve filas afectadas |
| `tx(async (client) => …)` | Transacción; pasá `client` como último argumento a los helpers |

Consultas parametrizadas siempre (`$1`, `$2`…), nunca interpolación de strings.
Rutas y componentes **no** ejecutan SQL: piden al servicio. (Hay alguna consulta
puntual en páginas del panel para datos auxiliares; código nuevo va al servicio.)

`num()` es obligatorio para leer `COUNT`/`SUM`: `pg` devuelve BIGINT como string.

### 3. Validación con zod en todo lo que entra

```ts
const schema = z.object({ name: z.string().min(2, "Poné un nombre").max(80) });
export const POST = withTenant(async (tenant, req) => {
  const { name } = await parseBody(req, schema);
  …
});
```

Los mensajes de error de zod se le muestran a la persona: escribilos en
castellano, en segunda persona, diciendo qué hacer. Los esquemas compartidos
entre rutas viven en `src/server/schemas.ts` (una ruta de Next solo puede
exportar handlers).

### 4. Errores y respuestas

- `throw new ApiError(status, "mensaje")` para todo error esperable.
  `withTenant`/`withPublic` lo convierten en `{ error }` con ese status.
- Respuesta exitosa: `NextResponse.json({ … })`, o `{ ok: true }` si no hay dato
  que devolver.
- Los errores de conexión con la base se detectan y responden **503 con una
  explicación accionable** (ver `isDatabaseError` en `http.ts`). No los tapes con
  un 500 genérico.
- Logging: `log.info/warn/error("evento.punto", { … })`. **Nunca loguees emails,
  teléfonos, contraseñas ni contenido de respuestas** — el código existente
  loguea `userId`, contadores y poco más; seguí esa línea.

### 5. Migraciones de esquema

`src/server/schema.mjs` es la fuente única y corre entera en cada arranque
(`ensureSchema()`, protegida con advisory lock). `CREATE TABLE IF NOT EXISTS` no
modifica una tabla que ya existe, así que **cualquier cambio sobre una tabla
existente va al bloque "Migraciones" del final**, en sentencias repetibles sin
efecto:

```sql
ALTER TABLE forms ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'local';
```

Agregar la columna arriba y olvidarse del `ALTER` deja rotas todas las bases ya
creadas. Los valores por defecto de una migración tienen que ser conservadores:
lo que ya existía no debe cambiar de significado.

Las fechas se guardan como **texto ISO 8601 en UTC**: ordenan y comparan
lexicográficamente igual que cronológicamente. Para agrupar por mes, hora o día
de la semana en hora argentina están `monthKey`, `localHour` y `localWeekday` en
`db.ts`.

### 6. Paridad `/app` ⇄ `/demo`

`/demo` es el mismo panel corriendo **sin sesión y sin base de datos**, con los
datos en memoria de `src/server/demo-data.ts`. Cada página de `src/app/app/`
tiene su gemela en `src/app/demo/` que renderiza **el mismo componente de vista**
con `basePath="/demo"`.

Si tocás una sección del panel:

1. Actualizá la página de `/app` **y** la de `/demo`.
2. Cualquier enlace interno de un componente compartido se arma con `basePath`
   (por defecto `/app`), nunca con `/app` escrito a mano.
3. `api()` de `lib/client.ts` corta las escrituras dentro de `/demo` y lanza
   `DEMO_BLOCKED_MESSAGE`; para inhabilitar un control usá `useDemoMode()` y
   `DEMO_HINT` de `components/demo/DemoMode.tsx`.
4. Los ids de la demo son deterministas (contador, no `randomUUID`): la lista se
   genera al compilar y el detalle al pedirlo, en otro proceso. No los cambies
   por valores al azar.

Hay dos generadores de Café Martina y **los dos se mantienen**: `demo-data.ts`
(en memoria, para `/demo`) y `demo-seed.mjs` (PostgreSQL, para `npm run seed`).

### 7. Planes: se limitan funciones, nunca los datos

`src/lib/plans.ts` es la fuente única de precios y cupos; la landing, el panel y
los avisos leen de ahí. `src/server/plan-limits.ts` aplica los topes.

- Pasarse del tope de clientes **no** oculta, borra ni bloquea un solo cliente:
  son datos del comercio. Solo se avisa (`avisoDeUso`).
- Lo que se corta son herramientas: sin Pro no hay segmentos ni campañas, sin
  Business no hay WhatsApp. Se corta con `ApiError(402, …)` en la API **y** se
  avisa antes con `<PlanGate>` en la página, para no mostrar una herramienta que
  después falla al usarse.

### 8. Degradación en vez de rotura

El patrón se repite y hay que sostenerlo: **si falta una variable de entorno, la
función queda deshabilitada y el resto sigue andando.**

- Sin `RESEND_API_KEY` no se manda mail, queda en el log y el alta funciona igual.
- Sin `ADMIN_EMAILS` no entra nadie a `/admin` (cerrado por omisión, no abierto).
- Sin medio de cobro configurado, la app **no ofrece** cambiar de plan.
- Sin `CRON_SECRET` el cron anda igual, solo queda expuesto.
- Sin `DATABASE_URL` el build pasa y `/demo` funciona; las rutas responden 503
  con la explicación.

Los avisos por mail se disparan con `void notify…(…)` sin `await`: una operación
del usuario nunca espera al proveedor de mail ni falla por él.

### 9. Seguridad

- Contraseñas con `scrypt` nativo; comparación con `timingSafeEqual`.
- Sesiones: token opaco en cookie `httpOnly` + `sameSite: lax`, y en la base se
  guarda **solo el SHA-256** del token.
- `rateLimit()` por IP en login, registro y endpoints públicos. Es en memoria y
  por instancia: sirve, pero no lo presentes como defensa contra un atacante
  distribuido.
- `/admin` responde **404 y no 403** a quien no corresponde; un 403 confirmaría
  que la ruta existe.
- Los encabezados de seguridad y la CSP están en `next.config.ts`. Si un cambio
  necesita relajar la CSP, decilo explícitamente en el commit — hoy `img-src
  data:` está por los logos y QR, y `unsafe-eval` solo en desarrollo.

## Convenciones de código

**Idioma.** Todo el texto de cara al usuario, los comentarios y la documentación
van en **castellano rioplatense (voseo)**: "poné", "tenés", "probá". Los
identificadores están mezclados a propósito: la infraestructura y el dominio
técnico en inglés (`withTenant`, `businessId`, `submissions`), y las reglas de
negocio del producto en castellano (`checkPuedeSegmentar`, `avisoDeUso`,
`vencidos`). Seguí lo que ya usa el archivo que estás tocando.

**Comentarios.** El repositorio comenta el **porqué**, no el qué: qué problema
resuelve una decisión, qué pasaba antes, qué se rompería si se hace de otra
forma. Los bloques `/** … */` sobre módulos y funciones explican criterio de
producto, no firma de tipos. Mantené esa densidad y ese tono; no agregues
comentarios que repiten el código.

**Componentes.**

- Server Components por defecto. `"use client"` solo donde hace falta estado,
  efectos o eventos.
- Las páginas del panel llevan `export const dynamic = "force-dynamic"`.
- Patrón: la página (servidor) carga los datos y renderiza `<PageHeader>` + una
  vista cliente que recibe todo por props. Las vistas compartidas entre `/app` y
  `/demo` viven en `src/components/views/`; las propias de una sección, junto a
  su página.
- Usá el kit de `components/ui/` (`Button`, `Input`/`Field`/`Select`, `Modal`/
  `ConfirmModal`, `EmptyState`, `Dropdown`, `Tabs`, `Badge`, `Switch`,
  `SearchInput`, `Skeleton`) antes de escribir un control nuevo.
- Avisos al usuario con `useToast()`; confirmaciones destructivas con
  `ConfirmModal`. Nada de `alert()` ni `confirm()`.
- Explicaciones de para qué sirve una sección: prop `hint` de `PageHeader` o el
  componente `<Hint>`.

**Estilos.** Tailwind 4 sin archivo de configuración: el tema vive en el bloque
`@theme` de `src/app/globals.css` (escalas `ink-*`, `brand-*`, `coral`,
`inkblack`, `offwhite`, sombras `card`/`raised`/`pop`/`modal`, animaciones).
Usá esos tokens, no colores sueltos. Hay utilidades propias en el mismo archivo
(`.card`, `.body-copy`, `.display-title`, `.font-display`, `.tabular`, `.lift`,
`.reveal`…). Clases condicionales con `cn()` de `lib/utils.ts`. Íconos:
`lucide-react`.

Dos paletas conviven: **naranja `brand-*`** en el panel y **`coral` +
`inkblack`** en las pantallas públicas (landing, login, registro, alta). El
`Button` tiene variantes para cada una (`brand` y `coral`).

**Cliente HTTP.** Desde el navegador siempre `api()` de `lib/client.ts` (maneja
método, JSON, errores tipados y el corte de la demo), nunca `fetch` directo a la
API interna.

## Modelo de datos

`users` · `sessions` · `businesses` · `memberships` (roles `owner`/`admin`/
`miembro`) · `invitations` · `forms` · `questions` · `customers` ·
`tags`/`customer_tags` · `submissions` · `answers` · `scans` · `segments` ·
`campaigns` · `campaign_recipients` · `payments`.

Detalles que importan al tocar código:

- **Identidad del cliente**: al enviar el formulario se resuelve por
  **teléfono → email → nombre** dentro del negocio (`services/submissions.ts`).
  Los datos nuevos completan la ficha, **no pisan** los existentes; quien vuelve
  suma visita en su misma ficha.
- **`origin`** (`local` | `online`) en `forms` y `customers`: de dónde se ganó al
  cliente. En `customers` **no se pisa nunca** después del alta.
- **`campaign_recipients`** es una cola con estado. "Enviar" hoy materializa las
  filas en `queued`; integrar WhatsApp Business API o un proveedor de email es un
  worker que las consume, sin cambios de esquema.
- **`payments`** guarda el monto del momento: los precios de lista cambian y el
  historial tiene que seguir mostrando lo que se cobró. El cobro es manual de
  punta a punta (el comercio paga por fuera, avisa desde su panel, llega un mail,
  se confirma en `/admin`). Vencer un plan **no** baja a nadie a Free: solo avisa.

## Rutas de API

Todas devuelven JSON y llevan un envoltorio: `withTenant` (panel), `withPublic`
(sin sesión) o `requireAdmin` dentro de `withPublic` (administración).

| Grupo | Rutas |
|---|---|
| Auth | `/api/auth/{login,register,logout,switch,accept-invite}` |
| Negocio | `/api/business` |
| Formularios | `/api/forms`, `/api/forms/[id]`, `/api/forms/[id]/{questions,questions/[qid],duplicate}` |
| Público (QR) | `/api/public/forms/[slug]/{scan,submit}` |
| Clientes | `/api/customers/[id]`, `/api/customers/[id]/tags`, `/api/tags` |
| Registros | `/api/submissions/[id]` |
| Segmentos | `/api/segments`, `/api/segments/[id]`, `/api/segments/preview` |
| Campañas | `/api/campaigns`, `/api/campaigns/[id]`, `/api/campaigns/[id]/send`, `/api/campaigns/audience` |
| Equipo | `/api/team/invite`, `/api/team/invite/[id]`, `/api/team/members/[id]` |
| Cobro | `/api/billing/request`, `/api/admin/payments/[id]`, `/api/admin/plan` |
| Cron | `/api/cron/vencimientos` (diaria, 12:00 UTC, ver `vercel.json`) |

En Next 15 los params son promesas:
`async (tenant, req, ctx: { params: Promise<{ id: string }> })` → `await ctx.params`.

## Contenido público

- **Landing bilingüe**: `/` (es) y `/en`. Todo el texto está en
  `src/lib/landing-copy.ts` bajo `COPY.es` / `COPY.en`. **Si agregás una sección,
  agregá las dos versiones**; el componente `Landing` es uno solo.
- **Blog**: los artículos son datos en `src/lib/blog.ts` (no hay CMS ni
  markdown). Cada uno desarrolla una pregunta frecuente de la portada. Al sumar
  un artículo queda automáticamente en `sitemap.ts`.
- **Contacto**: WhatsApp y email en `src/lib/contact.ts`, en un solo lugar.

## Commits

Mensajes en castellano, en una línea, que dicen **qué cambia para quien usa el
producto** — no qué archivos se tocaron. Los últimos commits abandonaron los
prefijos de Conventional Commits; seguí ese estilo:

```
Mandar el código de descuento por mail para verificar el correo
Separar los clientes ganados por delivery de los del local
El código de descuento sale a nombre del comercio, no de SynapBase
```

Antes de commitear: `npm run typecheck` y `npm run build`.

## Trampas conocidas

- **`pg` devuelve BIGINT como string** (`COUNT`, `SUM`). Pasalo por `num()`.
- **Los ids de `/demo` tienen que ser deterministas** — con `randomUUID()` el
  detalle de cualquier formulario de la demo da 404.
- **La demo no puede escribir**: si agregás una acción al panel, verificá que en
  `/demo` quede inhabilitada con `useDemoMode()`, no que reviente.
- **Migraciones**: agregar una columna arriba en `schema.mjs` sin el `ALTER … IF
  NOT EXISTS` del final rompe todas las bases existentes.
- **El pool y el esquema son singletons globales** (`globalThis.__synapbase_*`)
  para sobrevivir al HMR y reutilizarse entre invocaciones serverless.
- **Resend sin dominio verificado** solo entrega a la casilla dueña de la cuenta:
  los avisos internos llegan, el código al cliente del comercio no. Por eso
  existe el modo de entrega "pantalla y mail" en los formularios.
- **Variables de entorno en Vercel**: se congelan al construir. Después de tocar
  una hay que hacer *Redeploy* (es el error más común, ver DEPLOY.md).
