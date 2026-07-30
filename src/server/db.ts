import { Pool, type PoolClient } from "pg";
import { SCHEMA } from "./schema.mjs";
import crypto from "node:crypto";

/**
 * Capa de acceso a PostgreSQL.
 *
 * Todo el resto del backend habla con la base únicamente a través de los
 * helpers de este archivo (`rows`, `one`, `run`, `tx`). Cambiar de proveedor
 * de base de datos no debería requerir tocar servicios, rutas ni interfaz.
 */

const CONNECTION_STRING =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.SYNAPBASE_DATABASE_URL ??
  "";

declare global {
  // eslint-disable-next-line no-var
  var __synapbase_pool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __synapbase_schema: Promise<void> | undefined;
}

function isLocal(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || url.includes("host=/");
}

/** Pool singleton (sobrevive al HMR de Next y se reutiliza entre invocaciones). */
export function pool(): Pool {
  if (globalThis.__synapbase_pool) return globalThis.__synapbase_pool;
  if (!CONNECTION_STRING) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL con la cadena de conexión de PostgreSQL. " +
        "Copiá .env.example a .env.local y completala (ver DEPLOY.md).",
    );
  }
  const p = new Pool({
    connectionString: CONNECTION_STRING,
    // Neon, Supabase y similares exigen TLS; en local no.
    ssl: isLocal(CONNECTION_STRING) ? false : { rejectUnauthorized: false },
    // En serverless conviene un pool chico: cada instancia abre el suyo.
    max: Number(process.env.PGPOOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  p.on("error", () => {
    /* conexiones inactivas cerradas por el proveedor: el pool las repone */
  });
  globalThis.__synapbase_pool = p;
  return p;
}

/**
 * Crea las tablas si no existen. Se ejecuta una vez por proceso y usa un
 * advisory lock para que varias instancias concurrentes (serverless) no
 * intenten crear el esquema a la vez.
 */
export function ensureSchema(): Promise<void> {
  if (globalThis.__synapbase_schema) return globalThis.__synapbase_schema;
  globalThis.__synapbase_schema = (async () => {
    const client = await pool().connect();
    try {
      await client.query("SELECT pg_advisory_lock($1)", [727272]);
      try {
        await client.query(SCHEMA);
      } finally {
        await client.query("SELECT pg_advisory_unlock($1)", [727272]);
      }
    } catch (err) {
      // Si falla, permitir un nuevo intento en la próxima consulta.
      globalThis.__synapbase_schema = undefined;
      throw err;
    } finally {
      client.release();
    }
  })();
  return globalThis.__synapbase_schema;
}

/** Cualquier cosa capaz de ejecutar SQL: el pool o un cliente en transacción. */
export interface Executor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
}

async function exec<T extends Record<string, unknown>>(
  text: string,
  params: unknown[],
  runner: Executor | undefined,
): Promise<{ rows: T[]; rowCount: number | null }> {
  if (runner) return runner.query<T>(text, params);
  await ensureSchema();
  return pool().query<T>(text, params);
}

/** Devuelve todas las filas. */
export async function rows<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
  runner?: Executor,
): Promise<T[]> {
  const res = await exec<T>(text, params, runner);
  return res.rows;
}

/** Devuelve la primera fila o undefined. */
export async function one<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
  runner?: Executor,
): Promise<T | undefined> {
  const res = await exec<T>(text, params, runner);
  return res.rows[0];
}

/** Ejecuta una escritura y devuelve la cantidad de filas afectadas. */
export async function run(
  text: string,
  params: unknown[] = [],
  runner?: Executor,
): Promise<number> {
  const res = await exec(text, params, runner);
  return res.rowCount ?? 0;
}

/**
 * Transacción: el callback recibe el cliente y debe pasarlo como último
 * argumento a los helpers para que todo participe de la misma transacción.
 */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* la conexión ya estaba caída */
    }
    throw err;
  } finally {
    client.release();
  }
}

/* ————— Utilidades ————— */

export function nowIso(): string {
  return new Date().toISOString();
}

export function uid(): string {
  return crypto.randomUUID();
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
/** Código corto legible (slugs públicos, códigos de descuento). */
export function shortCode(len = 6): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** pg devuelve BIGINT (COUNT, SUM) como string para no perder precisión. */
export function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* ————— Fechas en la zona horaria del comercio ————— */

const AR_TZ = "America/Argentina/Buenos_Aires";

export function monthKey(iso: string, timeZone = AR_TZ): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  return `${y}-${m}`;
}

export function localHour(date: Date, timeZone = AR_TZ): number {
  return (
    Number(
      new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date),
    ) % 24
  );
}

export function localWeekday(date: Date, timeZone = AR_TZ): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/** Clave de mes actual y de hace N meses (TZ AR). */
export function monthKeyNow(offsetMonths = 0, timeZone = AR_TZ): string {
  const now = new Date();
  const key = monthKey(now.toISOString(), timeZone);
  if (offsetMonths === 0) return key;
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + offsetMonths, 15));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
