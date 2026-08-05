#!/usr/bin/env node
/**
 * Crea (o actualiza) las tablas en la base PostgreSQL: `npm run db:setup`.
 * Es idempotente: se puede correr las veces que haga falta.
 */
import pg from "pg";
import { SCHEMA } from "../src/server/schema.mjs";

const url =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SYNAPBASE_DATABASE_URL;
if (!url) {
  console.error("✖ Falta la variable DATABASE_URL con la cadena de conexión de PostgreSQL.");
  console.error("  Copiá .env.example a .env.local y completala (ver DEPLOY.md).");
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
const client = new pg.Client({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(SCHEMA);
  const { rows } = await client.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = 'public'",
  );
  console.log(`✔ Esquema listo (${rows[0].c} tablas en la base)`);
} finally {
  await client.end();
}
