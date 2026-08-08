import "server-only";
import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { getTenant, type Tenant } from "./auth";
import { log } from "./log";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as unknown as Record<string, unknown>, init);
}

/**
 * Envuelve un handler autenticado: resuelve el tenant, captura errores y
 * devuelve JSON consistente. El aislamiento multi-tenant nace acá.
 */
export function withTenant<Args extends unknown[]>(
  handler: (tenant: Tenant, req: Request, ...args: Args) => Promise<Response> | Response,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      const tenant = await getTenant();
      if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      return await handler(tenant, req, ...args);
    } catch (err) {
      return handleError(err, req);
    }
  };
}

export function withPublic<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response> | Response,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      return handleError(err, req);
    }
  };
}

/**
 * Códigos de PostgreSQL y de red que significan "la base no está disponible",
 * a diferencia de un error de la aplicación.
 *
 *   ECONNREFUSED / ENOTFOUND / ETIMEDOUT — no se llegó al servidor
 *   28P01 — contraseña rechazada
 *   3D000 — la base no existe
 *   57P03 — el servidor está arrancando
 */
const DB_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "28P01",
  "3D000",
  "57P03",
]);

/**
 * ¿Es un problema de conexión con la base y no un error de la aplicación?
 *
 * Importa distinguirlos: si la base no está configurada, decir "ocurrió un
 * error inesperado" deja a quien se registra sin idea de qué pasó, y a quien
 * administra el sitio sin idea de qué arreglar.
 */
function isDatabaseError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = String((err as { code?: unknown }).code ?? "");
  if (DB_ERROR_CODES.has(code)) return true;
  return (
    err.message.includes("DATABASE_URL") ||
    /password authentication|database .* does not exist|Connection terminated|connection timeout|timeout expired/i.test(
      err.message,
    )
  );
}

function handleError(err: unknown, req: Request): Response {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const message = err instanceof Error ? err.message : String(err);
  log.error("api.unhandled", { url: req.url, message });

  if (isDatabaseError(err)) {
    return NextResponse.json(
      {
        error:
          "La base de datos todavía no está conectada, así que no se puede crear ni consultar cuentas. " +
          "Si administrás el sitio: configurá la variable DATABASE_URL (ver DEPLOY.md). " +
          "Mientras tanto podés recorrer la demo, que funciona sin base de datos.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "Ocurrió un error inesperado. Probá de nuevo." },
    { status: 500 },
  );
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "El cuerpo de la petición no es JSON válido");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.length ? ` (${issue.path.join(".")})` : "";
    throw new ApiError(400, `${issue?.message ?? "Datos inválidos"}${path}`);
  }
  return result.data;
}

/** Verificación simple de rol para acciones administrativas. */
export function requireRole(tenant: Tenant, roles: string[]) {
  if (!roles.includes(tenant.role)) {
    throw new ApiError(403, "No tenés permisos para esta acción");
  }
}
