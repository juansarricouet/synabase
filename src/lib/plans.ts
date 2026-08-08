/**
 * Planes, cupos de mensajes y el modelo de costos de WhatsApp.
 *
 * Es la única fuente de verdad: la landing, el panel y los avisos de las
 * campañas leen de acá. Si cambia un precio o el costo del proveedor, se toca
 * este archivo y se propaga a todo.
 */

export type PlanId = "free" | "pro" | "business";

/* ————— Costos ————— */

/**
 * Lo que cobra Meta por cada plantilla de marketing entregada, en dólares.
 *
 * ⚠️ Revisar contra el tarifario vigente: Meta ya cambió el esquema más de una
 * vez (pasó de cobrar por conversación a cobrar por mensaje).
 */
export const WHATSAPP_COST_USD = 0.065;

/** Pesos por dólar. Se actualiza a mano junto con los precios de venta. */
export const USD_RATE = 1200;

/**
 * Margen objetivo sobre los mensajes: 0.5 significa que la mitad de lo que
 * cobrás es ganancia. El precio sale de `costo / (1 - margen)`, no de sumarle
 * un 50% al costo — sumarle 50% dejaría un margen de 33%, no de 50%.
 */
export const TARGET_MARGIN = 0.5;

/** Costo en pesos de un mensaje de WhatsApp, redondeado al peso. */
export function whatsappCostArs(): number {
  return Math.round(WHATSAPP_COST_USD * USD_RATE);
}

/**
 * Precio al comercio por cada mensaje que se pasa del cupo, ya con el margen
 * aplicado y redondeado a la decena para que quede prolijo en pantalla.
 */
export function extraMessagePriceArs(): number {
  const raw = whatsappCostArs() / (1 - TARGET_MARGIN);
  return Math.ceil(raw / 10) * 10;
}

/* ————— Planes ————— */

export interface PlanSpec {
  id: PlanId;
  name: string;
  /** Precio mensual en pesos. */
  ars: number;
  /** Mensajes de WhatsApp incluidos por mes. 0 = el plan no incluye WhatsApp. */
  whatsappIncluded: number;
  /** El email propio cuesta centavos, así que no se limita. */
  emailCampaigns: boolean;
  maxCustomers: number | null;
  maxForms: number | null;
}

export const PLANS: Record<PlanId, PlanSpec> = {
  free: {
    id: "free",
    name: "Free",
    ars: 0,
    whatsappIncluded: 0,
    emailCampaigns: false,
    maxCustomers: 100,
    maxForms: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    ars: 45000,
    whatsappIncluded: 0,
    emailCampaigns: true,
    maxCustomers: null,
    maxForms: null,
  },
  business: {
    id: "business",
    name: "Business",
    ars: 90000,
    /* 500 mensajes cuestan alrededor del 43% del abono: deja el margen por
       encima del 50% objetivo incluso si el dólar se mueve un poco. */
    whatsappIncluded: 500,
    emailCampaigns: true,
    maxCustomers: null,
    maxForms: null,
  },
};

export function planOf(id: string): PlanSpec {
  return PLANS[id as PlanId] ?? PLANS.free;
}

/* ————— Consumo del mes ————— */

export interface MessageUsage {
  /** Mensajes de WhatsApp enviados en el mes en curso. */
  used: number;
  /** Cupo del plan. */
  included: number;
  /** Cuántos quedan (nunca negativo). */
  remaining: number;
  /** Cuántos se pasaron del cupo. */
  over: number;
  /** Porcentaje consumido, tope 100, para la barra de progreso. */
  percent: number;
  /** Lo que se factura aparte por los excedentes, en pesos. */
  extraCostArs: number;
}

export function messageUsage(used: number, planId: string): MessageUsage {
  const included = planOf(planId).whatsappIncluded;
  const over = Math.max(0, used - included);
  return {
    used,
    included,
    remaining: Math.max(0, included - used),
    over,
    percent: included > 0 ? Math.min(100, Math.round((used / included) * 100)) : used > 0 ? 100 : 0,
    extraCostArs: over * extraMessagePriceArs(),
  };
}
