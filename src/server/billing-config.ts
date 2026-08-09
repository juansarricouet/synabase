import "server-only";

/**
 * Cómo cobra SynapBase.
 *
 * El cobro es manual: el comercio paga por fuera del sistema, avisa por
 * WhatsApp y alguien confirma desde el panel de administración. Acá vive lo
 * único que hace falta configurar para que eso funcione.
 *
 * Todo sale de variables de entorno para que cambiar un alias o un link no
 * requiera tocar código ni volver a desplegar el proyecto entero.
 */

export interface PaymentMethod {
  /** Link de cobro de Mercado Pago, si hay uno para ese plan. */
  link: string | null;
  /** Alias o CVU para transferir. Alcanza con esto para empezar a cobrar. */
  alias: string | null;
  /** A nombre de quién figura la cuenta, para que el que paga lo reconozca. */
  holder: string | null;
}

/** Datos de cobro para un plan. */
export function paymentMethod(planId: string): PaymentMethod {
  /* Se admite un link por plan o uno solo para todos: con una cuenta personal
     de Mercado Pago lo normal es tener un único link de monto abierto. */
  const general = process.env.PAYMENT_LINK ?? null;
  const link =
    planId === "pro"
      ? (process.env.PAYMENT_LINK_PRO ?? general)
      : planId === "business"
        ? (process.env.PAYMENT_LINK_BUSINESS ?? general)
        : null;

  return {
    link: link || null,
    alias: process.env.PAYMENT_ALIAS || null,
    holder: process.env.PAYMENT_HOLDER || null,
  };
}

/** ¿Está configurado algún medio de cobro? Si no, no se ofrece cambiar de plan. */
export function canCharge(planId: string): boolean {
  const m = paymentMethod(planId);
  return Boolean(m.link || m.alias);
}

/**
 * Días que dura un pago antes de vencer.
 *
 * No hay corte automático: al vencer, el plan sigue funcionando y el comercio
 * aparece marcado en el panel de administración para hablar con el dueño. Bajar
 * a Free es siempre una decisión manual.
 */
export const PLAN_DAYS = 30;

/** Emails que pueden entrar al panel de administración. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
