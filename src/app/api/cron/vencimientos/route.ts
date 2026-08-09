import { NextResponse } from "next/server";
import { rows } from "@/server/db";
import { log } from "@/server/log";
import { notifyExpirations } from "@/server/notify";

/**
 * Repaso diario de vencimientos.
 *
 * La dispara el cron de Vercel (ver vercel.json) una vez por día y manda un
 * mail con los planes que vencieron y los que están por vencer. No baja a nadie
 * de plan: sólo avisa, porque cortarle el servicio a un comercio es una
 * decisión que conviene tomar hablando con el dueño.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Cuántos días antes del vencimiento empezar a avisar. */
const PREAVISO = 5;

interface Fila extends Record<string, unknown> {
  id: string;
  name: string;
  plan: string;
  plan_expires_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

export async function GET(req: Request) {
  /* Vercel firma sus llamadas de cron con CRON_SECRET. Sin ese control, la ruta
     quedaría abierta y cualquiera podría dispararla para llenar la casilla. */
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
  }

  const ahora = new Date();
  const limite = new Date(ahora.getTime() + PREAVISO * 86400000).toISOString();

  const filas = await rows<Fila>(
    `SELECT b.id, b.name, b.plan, b.plan_expires_at, o.name AS owner_name, o.email AS owner_email
       FROM businesses b
       LEFT JOIN LATERAL (
         SELECT u.name, u.email FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.business_id = b.id AND m.role = 'owner'
         ORDER BY m.created_at ASC LIMIT 1
       ) o ON TRUE
      WHERE b.plan <> 'free'
        AND b.plan_expires_at IS NOT NULL
        AND b.plan_expires_at <= $1
      ORDER BY b.plan_expires_at ASC`,
    [limite],
  );

  const hoy = ahora.toISOString();
  const vencidos = filas.filter((f) => f.plan_expires_at < hoy);
  const porVencer = filas.filter((f) => f.plan_expires_at >= hoy);

  if (filas.length > 0) {
    await notifyExpirations({ vencidos, porVencer });
  }

  log.info("cron.vencimientos", { vencidos: vencidos.length, porVencer: porVencer.length });
  return NextResponse.json({ vencidos: vencidos.length, porVencer: porVencer.length });
}
