/**
 * Planes y lo que habilita cada uno.
 *
 * Es la única fuente de verdad: la landing, el panel y los límites leen de
 * acá. Si cambia un precio, se toca este archivo y se propaga a todo.
 *
 * Son dos y a propósito. Un tercer plan con WhatsApp existió un tiempo, pero
 * el canal nunca llegó a estar conectado a un proveedor: cobrar por algo que
 * no sale no corresponde, y tener un plan que casi nadie puede elegir sólo
 * complica la decisión de quien está mirando los precios.
 */

export type PlanId = "free" | "pro";

/**
 * Pesos por dólar, para mostrar los precios en la versión en inglés de la
 * portada. Se actualiza a mano junto con los precios de venta.
 */
export const USD_RATE = 1200;

export interface PlanSpec {
  id: PlanId;
  name: string;
  /** Precio mensual en pesos. */
  ars: number;
  /** Si incluye campañas por email. El email propio cuesta centavos, así que
   *  una vez habilitado no se limita por cantidad. */
  emailCampaigns: boolean;
  maxCustomers: number | null;
  maxForms: number | null;
}

export const PLANS: Record<PlanId, PlanSpec> = {
  free: {
    id: "free",
    name: "Free",
    ars: 0,
    emailCampaigns: false,
    maxCustomers: 100,
    maxForms: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    ars: 80000,
    emailCampaigns: true,
    maxCustomers: null,
    maxForms: null,
  },
};

/**
 * El plan de un comercio a partir de lo guardado en la base.
 *
 * `business` se acepta y se trata como Pro: es el plan viejo, y un comercio
 * que lo tenga contratado no puede perder funciones porque se haya cambiado
 * la lista de precios. Cualquier otro valor cae en Free.
 */
export function planOf(id: string): PlanSpec {
  if (id === "business") return PLANS.pro;
  return PLANS[id as PlanId] ?? PLANS.free;
}
