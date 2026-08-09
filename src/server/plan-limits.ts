import "server-only";
import { num, one } from "./db";
import { ApiError } from "./http";
import { planOf } from "@/lib/plans";

/**
 * Lo que cada plan habilita.
 *
 * El criterio: **se limitan funciones, nunca los datos**. Un comercio que se
 * pasa del tope de clientes sigue teniendo todos sus clientes guardados,
 * visibles y exportables — son datos de sus clientes, no nuestros, y
 * esconderlos o descartarlos para forzar un pago no corresponde.
 *
 * La presión para pasar de plan viene de las herramientas: sin Pro no hay
 * segmentos ni campañas, y sin Business no hay WhatsApp.
 */

/** Cuántos formularios activos tiene el comercio. */
async function contarFormularios(businessId: string): Promise<number> {
  const r = await one<{ c: string }>(
    "SELECT COUNT(*) AS c FROM forms WHERE business_id = $1 AND is_template = FALSE",
    [businessId],
  );
  return num(r?.c);
}

export async function contarClientes(businessId: string): Promise<number> {
  const r = await one<{ c: string }>("SELECT COUNT(*) AS c FROM customers WHERE business_id = $1", [
    businessId,
  ]);
  return num(r?.c);
}

/** Corta si el plan no permite crear otro formulario. */
export async function checkPuedeCrearFormulario(businessId: string, plan: string): Promise<void> {
  const max = planOf(plan).maxForms;
  if (max == null) return;
  const actuales = await contarFormularios(businessId);
  if (actuales >= max) {
    throw new ApiError(
      402,
      max === 1
        ? "El plan Free incluye un solo formulario. Pasá a Pro para tener todos los que quieras."
        : `Tu plan incluye hasta ${max} formularios. Pasá a Pro para tener ilimitados.`,
    );
  }
}

/** Corta si el plan no incluye segmentos. */
export function checkPuedeSegmentar(plan: string): void {
  if (plan === "free") {
    throw new ApiError(
      402,
      "Los segmentos vienen con el plan Pro. En Free tenés la base y las estadísticas.",
    );
  }
}

/** Corta si el plan no incluye ese canal de campañas. */
export function checkPuedeCampaña(plan: string, canal: string): void {
  const spec = planOf(plan);
  if (!spec.emailCampaigns) {
    throw new ApiError(
      402,
      "Las campañas vienen con el plan Pro. En Free tenés la base y las estadísticas.",
    );
  }
  if (canal === "whatsapp" && spec.whatsappIncluded === 0) {
    throw new ApiError(
      402,
      "Las campañas por WhatsApp vienen con el plan Business. Con Pro podés mandar por email.",
    );
  }
}

/* ————— Aviso por volumen ————— */

export interface AvisoDeUso {
  clientes: number;
  /** Tope del plan. Null cuando no hay. */
  max: number | null;
  /** Porcentaje del tope, con techo en 100. */
  porcentaje: number;
  /** Conviene mostrar el aviso a partir del 80%. */
  mostrar: boolean;
  /** Ya se pasó del tope. */
  excedido: boolean;
}

/**
 * Cuánto del tope de clientes lleva usado.
 *
 * Devuelve el estado para que el panel avise, sin bloquear nada: pasarse del
 * tope no borra ni oculta un solo cliente.
 */
export async function avisoDeUso(businessId: string, plan: string): Promise<AvisoDeUso> {
  const max = planOf(plan).maxCustomers;
  const clientes = await contarClientes(businessId);
  if (max == null) {
    return { clientes, max: null, porcentaje: 0, mostrar: false, excedido: false };
  }
  const porcentaje = Math.min(100, Math.round((clientes / max) * 100));
  return {
    clientes,
    max,
    porcentaje,
    mostrar: clientes >= max * 0.8,
    excedido: clientes > max,
  };
}
