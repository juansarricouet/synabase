import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, createUser, findUserByEmail, SESSION_COOKIE } from "@/server/auth";
import { parseBody, withPublic } from "@/server/http";
import { notifyNewSignup } from "@/server/notify";
import { clientIp, logBlocked, rateLimit } from "@/server/rate-limit";

const schema = z.object({
  name: z.string().min(2, "Contanos tu nombre").max(80),
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

/* Cinco cuentas por hora y por IP: nadie da de alta más que eso de verdad. */
const MAX_ALTAS = 5;
const VENTANA_MS = 60 * 60 * 1000;

export const POST = withPublic(async (req) => {
  const data = await parseBody(req, schema);

  const key = `register:${clientIp(req)}`;
  const { blocked, retryAfter } = rateLimit(key, MAX_ALTAS, VENTANA_MS);
  if (blocked) {
    logBlocked("auth.register_rate_limited", key, retryAfter);
    return NextResponse.json(
      { error: "Demasiadas cuentas creadas desde esta conexión. Probá más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (await findUserByEmail(data.email)) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email. Probá iniciar sesión." },
      { status: 409 },
    );
  }
  const user = await createUser(data.email, data.name, data.password);

  /* Sin await: el alta no debe esperar al proveedor de mail ni fallar si está
     caído. `notifyNewSignup` ya atrapa sus propios errores. */
  void notifyNewSignup({ name: user.name, email: user.email });

  const { token, expiresAt } = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
  return NextResponse.json({ ok: true });
});
