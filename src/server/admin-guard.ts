import "server-only";
import { getCurrentUser, type SessionUser } from "./auth";
import { isAdminEmail } from "./billing-config";
import { ApiError } from "./http";
import { log } from "./log";

/**
 * Acceso al panel de administración.
 *
 * Es la sesión normal más una lista de emails permitidos: no hay una segunda
 * contraseña que alguien pueda adivinar, y si mañana se filtra la URL del panel
 * eso solo no alcanza para entrar.
 *
 * Con la lista vacía no entra nadie. Es a propósito: si falta la variable de
 * entorno, es preferible que el panel quede cerrado a que quede abierto.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!isAdminEmail(user.email)) {
    log.warn("admin.denied", { userId: user.id });
    return null;
  }
  return user;
}

/** Versión para las rutas de API: corta con 404 en vez de 403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getAdminUser();
  if (!user) {
    // 404 y no 403: un 403 confirmaría que la ruta existe.
    throw new ApiError(404, "No encontrado");
  }
  return user;
}
