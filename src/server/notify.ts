import "server-only";
import { log } from "./log";

/**
 * Avisos por mail para el dueño del producto.
 *
 * Se manda con Resend porque no necesita servidor SMTP: una clave y un POST.
 * Si no hay clave configurada el aviso queda en el log y la operación sigue —
 * nadie debería quedarse sin poder registrarse porque falló un mail.
 */

/**
 * Endpoint del proveedor de mail.
 *
 * Se puede sobreescribir por entorno para apuntar a otro proveedor compatible
 * o a un receptor local cuando se prueba el envío sin mandar nada de verdad.
 */
const RESEND_ENDPOINT = process.env.RESEND_ENDPOINT ?? "https://api.resend.com/emails";

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

/**
 * La dirección sola, sin el nombre que se muestra.
 *
 * `NOTIFY_EMAIL_FROM` se escribe de las dos formas: `Nombre <a@b.com>` o
 * `a@b.com` pelado.
 */
function fromAddress(): string {
  const m = notifyFrom().match(/<([^>]+)>/);
  return (m ? m[1] : notifyFrom()).trim();
}

/**
 * Nombre para mostrar, apto para un encabezado de mail.
 *
 * El nombre del comercio lo escribe quien se registra, así que no se puede
 * confiar en él: un salto de línea ahí adentro permitiría colgar encabezados
 * extra al mensaje. Se descartan los saltos, las comillas y los ángulos, y se
 * recorta el largo.
 */
function nombreParaEncabezado(nombre: string): string {
  const limpio = nombre
    .replace(/[\r\n]+/g, " ")
    .replace(/["<>\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return limpio;
}

/**
 * Remitente para un comercio.
 *
 * Al cliente le llega de parte del comercio donde estuvo, no de SynapBase: en
 * la bandeja de entrada ve “Inmigrante Resto Bar”, que es lo que reconoce. La
 * dirección sigue siendo la nuestra —es la única que está verificada—, sólo
 * cambia el nombre visible.
 */
function fromParaComercio(businessName: string): string {
  const nombre = nombreParaEncabezado(businessName);
  return nombre ? `${nombre} <${fromAddress()}>` : notifyFrom();
}

/**
 * Envío a una dirección cualquiera.
 *
 * Se usa para escribirle a los clientes del comercio, no sólo a la casilla de
 * administración. Devuelve si salió, porque de eso depende que al cliente le
 * llegue su código: acá el resultado sí importa.
 */
export async function sendMailTo(
  to: string,
  subject: string,
  html: string,
  /** Nombre visible del remitente. Sin esto sale a nombre de SynapBase. */
  fromName?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.info("mail.skipped", { subject, reason: "falta RESEND_API_KEY" });
    return false;
  }
  try {
    const from = fromName ? fromParaComercio(fromName) : notifyFrom();
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      log.error("mail.failed", { subject, status: res.status, body: await res.text() });
      return false;
    }
    return true;
  } catch (err) {
    log.error("mail.error", { subject, message: err instanceof Error ? err.message : String(err) });
    return false;
  }
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

/**
 * El código de descuento, al mail que dejó el cliente.
 *
 * Va con el resumen de lo que respondió, como el acuse de un formulario de
 * Google: sirve de comprobante para mostrar en el mostrador y hace que el
 * correo quede verificado solo — si es falso, el código no llega.
 */
export async function sendDiscountCode(data: {
  to: string;
  customerName: string;
  businessName: string;
  code: string;
  incentive: string;
  answers: { label: string; value: string }[];
}): Promise<boolean> {
  const negocio = escapeHtml(data.businessName);
  const nombre = escapeHtml(data.customerName.split(" ")[0] ?? data.customerName);
  const code = escapeHtml(data.code);

  const resumen = data.answers
    .filter((a) => a.value)
    .map(
      (a) => `<tr>
        <td style="padding:7px 16px 7px 0;color:#777;font-size:13px;vertical-align:top">${escapeHtml(a.label)}</td>
        <td style="padding:7px 0;font-size:13px;color:#111">${escapeHtml(a.value)}</td>
      </tr>`,
    )
    .join("");

  return sendMailTo(
    data.to,
    `Tu código en ${data.businessName}: ${data.code}`,
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <p style="margin:0 0 4px;font-size:14px;color:#777">${negocio}</p>
      <h1 style="margin:0 0 18px;font-size:22px">¡Gracias, ${nombre}!</h1>

      <div style="border:2px dashed #ff5a45;border-radius:16px;padding:22px;text-align:center;background:#fff5f2">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999">Tu código</p>
        <p style="margin:0;font-size:30px;font-weight:800;letter-spacing:3px;font-family:ui-monospace,monospace;color:#111">${code}</p>
        <p style="margin:10px 0 0;font-size:14px;font-weight:600;color:#c73418">${escapeHtml(data.incentive)}</p>
      </div>

      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#444">
        Mostrá este mail en la caja para usar tu beneficio.
      </p>

      ${resumen ? `<h2 style="margin:28px 0 6px;font-size:14px;color:#111">Lo que respondiste</h2>
      <table style="border-collapse:collapse;width:100%">${resumen}</table>` : ""}

      <p style="margin:28px 0 0;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:14px">
        Recibís este mail porque completaste el formulario de ${negocio}. Impulsado por SynapBase.
      </p>
    </div>`,
    /* Sale a nombre del comercio: el cliente estuvo ahí y lo reconoce en la
       bandeja de entrada. “SynapBase” no le dice nada. */
    data.businessName,
  );
}
