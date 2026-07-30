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
3. En **Environment Variables** agregá:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena *pooled* que copiaste de Neon |

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
También podés cargarlo desde el botón **“Explorar la demo”** de la pantalla de login.

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

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | sí | Cadena de conexión a PostgreSQL |
| `PGPOOL_MAX` | no | Máximo de conexiones del pool (por defecto 5) |

---

## Copias de seguridad

Toda la base de clientes vive en PostgreSQL. Neon hace *backups* automáticos y
permite restaurar a un punto en el tiempo. De todos modos, conviene exportar
periódicamente desde **Base de datos → Exportar** dentro de la aplicación.
