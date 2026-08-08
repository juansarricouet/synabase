import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate, createSession, SESSION_COOKIE } from "@/server/auth";
import { parseBody, withPublic } from "@/server/http";
import { log } from "@/server/log";
import { clientIp, logBlocked, rateLimit, rateLimitReset } from "@/server/rate-limit";

const schema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

/* Diez intentos cada quince minutos por IP. Alcanza de sobra para quien se
   equivoca de contraseña y encarece muchísimo probar de a miles. */
const MAX_INTENTOS = 10;
const VENTANA_MS = 15 * 60 * 1000;

export const POST = withPublic(async (req) => {
  const data = await parseBody(req, schema);

  const key = `login:${clientIp(req)}`;
  const { blocked, retryAfter } = rateLimit(key, MAX_INTENTOS, VENTANA_MS);
  if (blocked) {
    logBlocked("auth.login_rate_limited", key, retryAfter);
    return NextResponse.json(
      { error: "Demasiados intentos fallidos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const user = await authenticate(data.email, data.password);
  if (!user) {
    log.warn("auth.login_failed", {});
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  // Entró bien: se libera el cupo para no penalizar a quien comparte IP.
  rateLimitReset(key);
  const { token, expiresAt } = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
  log.info("auth.login", { userId: user.id });
  return NextResponse.json({ ok: true });
});
