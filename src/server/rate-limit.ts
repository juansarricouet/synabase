import "server-only";
import { log } from "./log";

/**
 * Límite de intentos por IP, en memoria.
 *
 * ⚠️ Alcance real: en Vercel cada instancia serverless tiene su propia memoria,
 * así que esto frena el abuso de una sola fuente pero no es una defensa dura
 * contra un atacante distribuido. Para eso hace falta un almacén compartido
 * (Upstash Redis, Vercel KV). Aun así vale la pena: encarece muchísimo el
 * ataque más común, que es probar contraseñas desde una IP.
 */

interface Bucket {
  count: number;
  /** Momento en que se reinicia la ventana. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Evita que el mapa crezca sin techo si el proceso vive mucho tiempo. */
function sweep(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Registra un intento y dice si hay que rechazarlo.
 *
 * @param key      Identifica a quien intenta (por ejemplo `login:1.2.3.4`).
 * @param limit    Intentos permitidos dentro de la ventana.
 * @param windowMs Duración de la ventana.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { blocked: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { blocked: false, retryAfter: 0 };
  }

  b.count++;
  if (b.count > limit) {
    return { blocked: true, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { blocked: false, retryAfter: 0 };
}

/** Libera el cupo de una clave. Se usa cuando el intento resultó legítimo. */
export function rateLimitReset(key: string) {
  buckets.delete(key);
}

/**
 * IP de quien hace el pedido.
 *
 * Detrás de un proxy la real es la primera de `x-forwarded-for`. Si no hay
 * ninguna cabecera se devuelve un valor fijo, que hace que todos compartan el
 * mismo cupo: es más restrictivo, no menos.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "desconocida";
}

/** Deja registro del bloqueo, para poder detectar un ataque en los logs. */
export function logBlocked(event: string, key: string, retryAfter: number) {
  log.warn(event, { key, retryAfter });
}
