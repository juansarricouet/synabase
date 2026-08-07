/** Cliente HTTP mínimo para hablar con la API interna. */

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Mensaje único para todo lo que no se puede hacer sin cuenta. */
export const DEMO_BLOCKED_MESSAGE =
  "Esto se guarda solo con tu cuenta. En la demo podés mirar y probar la navegación.";

/**
 * La demo comparte los componentes del panel real, pero corre sin sesión y sin
 * base de datos: cualquier llamada de escritura terminaría en un error del
 * servidor. Cortamos acá para que el usuario vea un aviso claro en vez de un
 * 500, sin tener que duplicar cada vista.
 */
export function isDemo(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
}

export async function api<T = unknown>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  if (isDemo()) throw new ApiClientError(403, DEMO_BLOCKED_MESSAGE);
  const res = await fetch(path, {
    method: options?.method ?? (options?.body !== undefined ? "POST" : "GET"),
    headers: options?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* respuestas vacías */
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Error ${res.status}`;
    throw new ApiClientError(res.status, message);
  }
  return data as T;
}
