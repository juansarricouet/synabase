# Poner SynapBase online

SynapBase usa **PostgreSQL**, así que corre en cualquier plataforma moderna. La
opción recomendada —y **gratuita**— es **Vercel + Neon**.

Requisito: **Node.js 20 o superior**.

---

## Opción A — Vercel + Neon (gratis, recomendada)

### 1. Crear la base de datos en Neon

1. Entrá a [neon.tech](https://neon.tech) y creá una cuenta (plan Free).
2. **Create project** → nombre `synapbase`, región la más cercana (por ejemplo *AWS us-east-2*).
3. Copiá la cadena de conexión. **Importante:** usá la que dice **“Pooled connection”**
   (el host termina en `-pooler`). Se ve así:

   ```
   postgresql://usuario:clave@ep-algo-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   La versión con *pooler* es la que aguanta bien el modelo serverless de Vercel.

### 2. Desplegar en Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con GitHub.
2. **Add New → Project →** importá este repositorio.
3. En **Settings → Environments → Production** agregá:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena *pooled* que copiaste de Neon |

   Con eso alcanza para que el sitio levante. El panel de administración, el
   cobro y los mails necesitan algunas variables más: están todas en
   [Variables de entorno](#variables-de-entorno), al final de este documento.

4. **Deploy**. La primera vez tarda un par de minutos.

### 3. Crear las tablas

Las tablas se crean solas la primera vez que alguien entra a la aplicación.
Si preferís hacerlo antes, desde tu computadora:

```bash
npm install
echo "DATABASE_URL=postgresql://…" > .env.local
npm run db:setup
```

### 4. (Opcional) Cargar el comercio de demostración

```bash
npm run seed
```

Crea “Café Martina” con 185 clientes y 8 meses de historia, para explorar la app
con datos realistas. Acceso: `demo@synapbase.app` / `synapse-demo`.

No hace falta para mostrar el producto: **`/demo` funciona solo**, sin base de
datos y sin iniciar sesión, con ese mismo comercio armado en memoria. El seed
sirve para probar contra PostgreSQL de verdad.

> **Nota sobre el plan de Vercel:** el plan Hobby es gratuito para uso personal.
> Cuando empieces a cobrarles a comercios, corresponde el plan Pro.

---

## Opción B — Railway, Render o Fly.io

Cualquiera de estas plataformas sirve: agregás un servicio de PostgreSQL,
copiás su `DATABASE_URL` en las variables de entorno del servicio web y listo.
Tienen costo mensual (desde ~USD 5), pero no requieren ninguna configuración
extra respecto de la opción A.

---

## Correr en tu propia máquina

```bash
npm install
cp .env.example .env.local     # completá DATABASE_URL
npm run db:setup               # crea las tablas
npm run seed                   # opcional: datos de demo
npm run dev                    # http://localhost:3000
```

Para levantar un PostgreSQL local rápido con Docker:

```bash
docker run -d --name synapbase-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=synapbase -e POSTGRES_DB=synapbase postgres:16

# DATABASE_URL=postgresql://postgres:synapbase@localhost:5432/synapbase
```

---

## Variables de entorno

Se cargan en **Settings → Environments → Production** y hay que marcar las tres
casillas (*Production*, *Preview* y *Development*).

> **Un deploy hecho antes de guardar una variable no la tiene.** Vercel congela
> las variables en el momento de construir el sitio, así que después de tocar
> cualquiera hay que ir a **Deployments → ⋯ → Redeploy**. Es el error más
> común: se guardan las variables, no pasa nada, y parece que la aplicación
> está rota.

### Base de datos

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | sí | Cadena de conexión a PostgreSQL |
| `PGPOOL_MAX` | no | Máximo de conexiones del pool (por defecto 5) |

### Panel de administración

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `ADMIN_EMAILS` | sí, para usar `/admin` | Emails habilitados, separados por coma |

Sin esta variable **no entra nadie**, ni siquiera quien administra el sistema.
Es a propósito: si falta la configuración, es preferible que el panel quede
cerrado a que quede abierto.

`/admin` responde **404 y no 403** cuando el acceso no corresponde. Un 403 le
confirmaría a un desconocido que la ruta existe. Si al entrar aparece un 404,
las causas posibles son tres: no hay sesión iniciada, el email de la sesión no
figura en la lista, o falta el *redeploy*.

### Cobro

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `PAYMENT_LINK` | sí, para cobrar | Link de Mercado Pago, sirve para todos los planes |
| `PAYMENT_HOLDER` | recomendada | A nombre de quién figura la cuenta |
| `PAYMENT_ALIAS` | no | Alias o CVU, si además se acepta transferencia |
| `PAYMENT_LINK_PRO` | no | Link propio del plan Pro, si difiere del general |
| `PAYMENT_LINK_BUSINESS` | no | Link propio del plan Business |

Sin ningún medio de cobro configurado, la aplicación **no ofrece cambiar de
plan**: es preferible eso a mostrar un botón que no lleva a ninguna parte.

El cobro es manual de punta a punta. El comercio paga por fuera, avisa desde su
panel, llega un mail y alguien lo confirma desde `/admin`.

### Mail

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `RESEND_API_KEY` | sí, para mandar mails | Clave de [resend.com](https://resend.com) |
| `NOTIFY_EMAIL_TO` | sí, para los avisos | Casilla que recibe altas y pagos |
| `NOTIFY_EMAIL_FROM` | no | Remitente. Requiere dominio verificado |

Sin `RESEND_API_KEY` no se manda ningún mail, pero **nada se rompe**: queda
anotado en el log y la operación sigue. Nadie se queda sin poder registrarse
porque falló un mail.

**Sobre el dominio.** Resend sólo entrega a direcciones arbitrarias desde un
dominio verificado. Sin verificar nada se usa `onboarding@resend.dev`, que
**únicamente entrega a la casilla dueña de la cuenta de Resend**. En la
práctica:

| | Sin dominio verificado | Con dominio verificado |
|---|---|---|
| Avisos de alta y de pago | ✅ funcionan | ✅ funcionan |
| Código de descuento al cliente del comercio | ❌ no llega | ✅ llega |

Mientras no haya dominio, conviene dejar los formularios en **«pantalla y
mail»**: el código se muestra igual y nadie se queda sin su beneficio. El modo
«sólo por mail» —el que vuelve verificable la casilla— recién sirve cuando los
mails llegan de verdad.

Con dominio propio, `NOTIFY_EMAIL_FROM` va con una dirección de ese dominio,
por ejemplo `SynapBase <hola@tudominio.com>`. **Antes de tenerlo, dejarla sin
definir**: puesta a mano rompe el envío.

### Vencimientos

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `CRON_SECRET` | recomendada | Protege la tarea diaria de vencimientos |

`vercel.json` programa `/api/cron/vencimientos` todos los días a las 12:00 UTC.
Avisa por mail qué planes vencieron o están por vencer. **No baja de plan a
nadie**: bajar a Free es siempre una decisión manual.

Vercel manda la clave sola en el encabezado `Authorization`. Sin la variable la
tarea funciona igual, pero cualquiera puede dispararla desde afuera; lo peor
que puede pasar es recibir avisos de más.

---

## Copias de seguridad

Toda la base de clientes vive en PostgreSQL. Neon hace *backups* automáticos y
permite restaurar a un punto en el tiempo. De todos modos, conviene exportar
periódicamente desde **Base de datos → Exportar** dentro de la aplicación.
