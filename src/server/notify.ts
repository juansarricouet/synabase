import "server-only";
import { log } from "./log";

/**
 * Avisos por mail para el dueño del producto.
 *
 * Se manda con Resend porque no necesita servidor SMTP: una clave y un POST.
 * Si no hay clave configurada el aviso queda en el log y la operación sigue —
 * nadie debería quedarse sin poder registrarse porque falló un mail.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Casilla que recibe los avisos. Sin esto, no se manda nada. */
function notifyTo(): string | null {
  return process.env.NOTIFY_EMAIL_TO ?? null;
}

/**
 * Remitente. Resend exige un dominio verificado; `onboarding@resend.dev` sirve
 * para probar sin verificar nada, pero sólo entrega a la casilla dueña de la
 * cuenta de Resend.
 */
function notifyFrom(): string {
  return process.env.NOTIFY_EMAIL_FROM ?? "SynapBase <onboarding@resend.dev>";
}

async function send(subject: string, html: string): Promise<void> {
  const to = notifyTo();
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !apiKey) {
    log.info("notify.skipped", {
      subject,
      reason: !to ? "falta NOTIFY_EMAIL_TO" : "falta RESEND_API_KEY",
    });
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: notifyFrom(), to: [to], subject, html }),
    });
    if (!res.ok) {
      log.error("notify.failed", { subject, status: res.status, body: await res.text() });
      return;
    }
    log.info("notify.sent", { subject, to });
  } catch (err) {
    log.error("notify.error", { subject, message: err instanceof Error ? err.message : String(err) });
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Aviso de cuenta nueva.
 *
 * Va con `void` desde la ruta de registro: el alta no debe esperar al mail ni
 * fallar si el proveedor está caído.
 */
export async function notifyNewSignup(user: {
  name: string;
  email: string;
}): Promise<void> {
  const name = escapeHtml(user.name);
  const email = escapeHtml(user.email);
  const when = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "short",
  });

  await send(
    `Cuenta nueva en SynapBase: ${name}`,
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#111">
      <h2 style="margin:0 0 4px;font-size:19px">Se registró alguien nuevo</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px">${escapeHtml(when)}</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 16px 6px 0;color:#666">Nombre</td><td style="padding:6px 0"><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px">
        <a href="mailto:${email}?subject=${encodeURIComponent("Tu cuenta de SynapBase")}"
           style="display:inline-block;background:#ff5a45;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">
          Escribirle para coordinar la reunión
        </a>
      </p>
      <p style="margin:24px 0 0;color:#999;font-size:12px">
        Todavía no eligió el nombre de su comercio: eso pasa en el paso siguiente.
      </p>
    </div>`,
  );
}

/** Aviso de comercio creado, que es cuando el alta queda completa. */
export async function notifyNewBusiness(data: {
  businessName: string;
  category: string | null;
  userName: string;
  userEmail: string;
}): Promise<void> {
  const biz = escapeHtml(data.businessName);
  const email = escapeHtml(data.userEmail);

  await send(
    `Comercio nuevo en SynapBase: ${biz}`,
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#111">
      <h2 style="margin:0 0 20px;font-size:19px">${biz} terminó de crear su cuenta</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 16px 6px 0;color:#666">Comercio</td><td style="padding:6px 0"><strong>${biz}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Rubro</td><td style="padding:6px 0">${escapeHtml(data.category ?? "—")}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">A cargo</td><td style="padding:6px 0">${escapeHtml(data.userName)}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px">
        <a href="mailto:${email}?subject=${encodeURIComponent(`Bienvenidos a SynapBase, ${data.businessName}`)}"
           style="display:inline-block;background:#ff5a45;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">
          Coordinar la reunión
        </a>
      </p>
    </div>`,
  );
}

/**
 * Aviso de que un comercio dice haber pagado.
 *
 * Es el disparador de la parte manual: llega el mail, se chequea el dinero en
 * Mercado Pago y se confirma desde /admin.
 */
export async function notifyPlanRequested(data: {
  businessName: string;
  plan: string;
  amountArs: number;
  userName: string;
  userEmail: string;
}): Promise<void> {
  const biz = escapeHtml(data.businessName);
  const email = escapeHtml(data.userEmail);
  const monto = data.amountArs.toLocaleString("es-AR");
  const plan = escapeHtml(data.plan === "pro" ? "Pro" : "Business");

  await send(
    `💰 ${biz} dice que pagó el plan ${plan}`,
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#111">
      <h2 style="margin:0 0 6px;font-size:19px">Hay un pago para confirmar</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px">
        Chequeá que el dinero haya entrado y confirmalo desde el panel.
      </p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 16px 6px 0;color:#666">Comercio</td><td style="padding:6px 0"><strong>${biz}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Plan</td><td style="padding:6px 0">${plan}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Monto</td><td style="padding:6px 0"><strong>$${monto}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666">Pidió</td><td style="padding:6px 0">${escapeHtml(data.userName)} · <a href="mailto:${email}">${email}</a></td></tr>
      </table>
      <p style="margin:24px 0 0;color:#999;font-size:12px">
        Hasta que lo confirmes, el comercio sigue en su plan anterior.
      </p>
    </div>`,
  );
}

interface Vencimiento {
  name: string;
  plan: string;
  plan_expires_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

function filaHtml(v: Vencimiento, vencido: boolean): string {
  const fecha = new Date(v.plan_expires_at).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "long",
  });
  const mail = v.owner_email ? escapeHtml(v.owner_email) : null;
  return `<tr>
    <td style="padding:8px 16px 8px 0;border-top:1px solid #eee"><strong>${escapeHtml(v.name)}</strong><br>
      <span style="color:#888;font-size:12px">${escapeHtml(v.owner_name ?? "sin dueño")}${mail ? ` · <a href="mailto:${mail}">${mail}</a>` : ""}</span></td>
    <td style="padding:8px 0;border-top:1px solid #eee;font-size:13px;color:${vencido ? "#c0392b" : "#b8860b"};white-space:nowrap">
      ${escapeHtml(v.plan === "pro" ? "Pro" : "Business")} · ${vencido ? "venció" : "vence"} el ${escapeHtml(fecha)}
    </td>
  </tr>`;
}

/**
 * Repaso diario de planes vencidos y por vencer.
 *
 * No corta el servicio de nadie: junta la lista para poder hablar con cada
 * dueño. Sólo se manda cuando hay algo que informar.
 */
export async function notifyExpirations(data: {
  vencidos: Vencimiento[];
  porVencer: Vencimiento[];
}): Promise<void> {
  const { vencidos, porVencer } = data;
  if (vencidos.length === 0 && porVencer.length === 0) return;

  const bloque = (titulo: string, lista: Vencimiento[], vencido: boolean) =>
    lista.length === 0
      ? ""
      : `<h3 style="margin:24px 0 8px;font-size:15px">${titulo} (${lista.length})</h3>
         <table style="border-collapse:collapse;width:100%;font-size:14px">
           ${lista.map((v) => filaHtml(v, vencido)).join("")}
         </table>`;

  await send(
    vencidos.length > 0
      ? `⚠️ ${vencidos.length} plan${vencidos.length === 1 ? "" : "es"} vencido${vencidos.length === 1 ? "" : "s"} en SynapBase`
      : `${porVencer.length} plan${porVencer.length === 1 ? "" : "es"} por vencer en SynapBase`,
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;color:#111">
      <h2 style="margin:0 0 6px;font-size:19px">Repaso de vencimientos</h2>
      <p style="margin:0;color:#666;font-size:14px">
        Nadie fue dado de baja: esto es para que puedas hablar con cada dueño.
      </p>
      ${bloque("Ya vencidos", vencidos, true)}
      ${bloque("Vencen en los próximos días", porVencer, false)}
    </div>`,
  );
}
