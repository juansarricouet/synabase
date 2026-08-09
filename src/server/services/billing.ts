import "server-only";
import { nowIso, num, one, rows, run, tx, uid } from "../db";
import { ApiError } from "../http";
import { log } from "../log";
import { PLAN_DAYS } from "../billing-config";
import { planOf, type PlanId } from "@/lib/plans";

export type PaymentStatus = "pendiente" | "confirmado" | "rechazado";

export interface Payment {
  id: string;
  business_id: string;
  business_name?: string;
  plan: string;
  amount_ars: number;
  status: PaymentStatus;
  note: string | null;
  resolved_at: string | null;
  created_at: string;
}

function rowToPayment(r: Record<string, unknown>): Payment {
  return {
    id: r.id as string,
    business_id: r.business_id as string,
    business_name: (r.business_name as string) ?? undefined,
    plan: r.plan as string,
    amount_ars: num(r.amount_ars),
    status: r.status as PaymentStatus,
    note: (r.note as string) ?? null,
    resolved_at: (r.resolved_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

/**
 * El comercio avisa que pagó un plan.
 *
 * Deja la solicitud pendiente y marca el plan pedido en el comercio, pero no
 * cambia el plan activo: eso pasa recién cuando alguien confirma que el dinero
 * llegó. El monto se copia del precio de lista del momento.
 */
export async function requestPlan(
  businessId: string,
  userId: string,
  plan: PlanId,
): Promise<Payment> {
  if (plan === "free") throw new ApiError(400, "El plan Free no necesita pago");
  const spec = planOf(plan);

  const pending = await one<{ id: string }>(
    "SELECT id FROM payments WHERE business_id = $1 AND status = 'pendiente'",
    [businessId],
  );
  if (pending) {
    throw new ApiError(409, "Ya hay un pago esperando confirmación. Escribinos si te olvidaste de mandar el comprobante.");
  }

  const id = uid();
  const now = nowIso();
  await tx(async (client) => {
    await run(
      `INSERT INTO payments (id, business_id, plan, amount_ars, status, requested_by, created_at)
       VALUES ($1, $2, $3, $4, 'pendiente', $5, $6)`,
      [id, businessId, plan, spec.ars, userId, now],
      client,
    );
    await run("UPDATE businesses SET pending_plan = $1 WHERE id = $2", [plan, businessId], client);
  });

  log.info("billing.requested", { businessId, plan });
  return (await getPayment(id))!;
}

export async function getPayment(id: string): Promise<Payment | undefined> {
  const r = await one(
    `SELECT p.*, b.name AS business_name FROM payments p
     JOIN businesses b ON b.id = p.business_id WHERE p.id = $1`,
    [id],
  );
  return r ? rowToPayment(r) : undefined;
}

/** Solicitud pendiente de un comercio, si tiene alguna. */
export async function pendingPayment(businessId: string): Promise<Payment | undefined> {
  const r = await one(
    "SELECT * FROM payments WHERE business_id = $1 AND status = 'pendiente' ORDER BY created_at DESC",
    [businessId],
  );
  return r ? rowToPayment(r) : undefined;
}

export async function paymentHistory(businessId: string): Promise<Payment[]> {
  const rs = await rows(
    "SELECT * FROM payments WHERE business_id = $1 ORDER BY created_at DESC LIMIT 24",
    [businessId],
  );
  return rs.map((r) => rowToPayment(r as Record<string, unknown>));
}

/**
 * Se confirma que el pago llegó: recién acá cambia el plan activo.
 *
 * El vencimiento se cuenta desde hoy, salvo que al comercio todavía le quede
 * tiempo del período anterior: en ese caso se suma, para no comerle días a
 * quien paga antes de que se le venza.
 */
export async function confirmPayment(paymentId: string, adminUserId: string): Promise<Payment> {
  const payment = await getPayment(paymentId);
  if (!payment) throw new ApiError(404, "Pago no encontrado");
  if (payment.status !== "pendiente") throw new ApiError(400, "Ese pago ya fue resuelto");

  const biz = await one<{ plan_expires_at: string | null }>(
    "SELECT plan_expires_at FROM businesses WHERE id = $1",
    [payment.business_id],
  );

  const now = Date.now();
  const current = biz?.plan_expires_at ? new Date(biz.plan_expires_at).getTime() : 0;
  const from = Number.isFinite(current) && current > now ? current : now;
  const expiresAt = new Date(from + PLAN_DAYS * 86400000).toISOString();
  const nowStr = nowIso();

  await tx(async (client) => {
    await run(
      "UPDATE payments SET status = 'confirmado', resolved_by = $1, resolved_at = $2 WHERE id = $3",
      [adminUserId, nowStr, paymentId],
      client,
    );
    await run(
      "UPDATE businesses SET plan = $1, plan_expires_at = $2, pending_plan = NULL WHERE id = $3",
      [payment.plan, expiresAt, payment.business_id],
      client,
    );
  });

  log.info("billing.confirmed", { businessId: payment.business_id, plan: payment.plan });
  return (await getPayment(paymentId))!;
}

/** Se rechaza el pago: el plan activo queda como estaba. */
export async function rejectPayment(
  paymentId: string,
  adminUserId: string,
  note?: string,
): Promise<Payment> {
  const payment = await getPayment(paymentId);
  if (!payment) throw new ApiError(404, "Pago no encontrado");
  if (payment.status !== "pendiente") throw new ApiError(400, "Ese pago ya fue resuelto");

  await tx(async (client) => {
    await run(
      "UPDATE payments SET status = 'rechazado', resolved_by = $1, resolved_at = $2, note = $3 WHERE id = $4",
      [adminUserId, nowIso(), note ?? null, paymentId],
      client,
    );
    await run("UPDATE businesses SET pending_plan = NULL WHERE id = $1", [payment.business_id], client);
  });

  log.info("billing.rejected", { businessId: payment.business_id });
  return (await getPayment(paymentId))!;
}

/** Cambio de plan hecho a mano desde administración, sin pago de por medio. */
export async function setPlanManually(businessId: string, plan: PlanId): Promise<void> {
  const expires =
    plan === "free" ? null : new Date(Date.now() + PLAN_DAYS * 86400000).toISOString();
  await run("UPDATE businesses SET plan = $1, plan_expires_at = $2, pending_plan = NULL WHERE id = $3", [
    plan,
    expires,
    businessId,
  ]);
  log.info("billing.plan_set_manually", { businessId, plan });
}

/* ————— Vista de administración ————— */

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  plan: string;
  pending_plan: string | null;
  plan_expires_at: string | null;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  customers: number;
  submissions: number;
  /** Solicitud esperando confirmación, si hay. */
  pending_payment_id: string | null;
  pending_amount: number | null;
  pending_since: string | null;
}

/**
 * Todos los comercios, con lo necesario para decidir de un vistazo: quién es el
 * dueño, en qué plan está, cuánto usa y si dejó un pago esperando.
 *
 * Es una sola consulta con subconsultas en vez de una por comercio: la lista se
 * mira entera y con una por fila se volvería lenta apenas haya clientes.
 */
export async function listAllBusinesses(): Promise<AdminBusiness[]> {
  const rs = await rows(
    `SELECT
       b.id, b.name, b.slug, b.category, b.plan, b.pending_plan, b.plan_expires_at, b.created_at,
       o.name  AS owner_name,
       o.email AS owner_email,
       (SELECT COUNT(*) FROM customers   c WHERE c.business_id = b.id) AS customers,
       (SELECT COUNT(*) FROM submissions s WHERE s.business_id = b.id) AS submissions,
       p.id         AS pending_payment_id,
       p.amount_ars AS pending_amount,
       p.created_at AS pending_since
     FROM businesses b
     LEFT JOIN LATERAL (
       SELECT u.name, u.email FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.business_id = b.id AND m.role = 'owner'
       ORDER BY m.created_at ASC LIMIT 1
     ) o ON TRUE
     LEFT JOIN LATERAL (
       SELECT id, amount_ars, created_at FROM payments
       WHERE business_id = b.id AND status = 'pendiente'
       ORDER BY created_at DESC LIMIT 1
     ) p ON TRUE
     ORDER BY b.created_at DESC`,
  );

  return rs.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      category: (row.category as string) ?? null,
      plan: row.plan as string,
      pending_plan: (row.pending_plan as string) ?? null,
      plan_expires_at: (row.plan_expires_at as string) ?? null,
      created_at: row.created_at as string,
      owner_name: (row.owner_name as string) ?? null,
      owner_email: (row.owner_email as string) ?? null,
      customers: num(row.customers),
      submissions: num(row.submissions),
      pending_payment_id: (row.pending_payment_id as string) ?? null,
      pending_amount: row.pending_amount == null ? null : num(row.pending_amount),
      pending_since: (row.pending_since as string) ?? null,
    };
  });
}
