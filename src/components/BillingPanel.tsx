"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, CreditCard, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client";
import { cn, formatDate, formatMoney, whatsappLink } from "@/lib/utils";
import { PLANS, planOf, type PlanId } from "@/lib/plans";
import { WHATSAPP_DISPLAY } from "@/lib/contact";
import type { PaymentMethod } from "@/server/billing-config";

export interface BillingInfo {
  plan: string;
  planExpiresAt: string | null;
  pendingPlan: string | null;
  /** Medios de cobro por plan, ya resueltos en el servidor. */
  methods: Record<string, PaymentMethod>;
  /** Teléfono al que se manda el comprobante. */
  supportPhone: string;
  canManage: boolean;
}

const ORDEN: PlanId[] = ["free", "pro", "business"];

/**
 * Plan y facturación del comercio.
 *
 * El cobro es por fuera del sistema: se paga con link o transferencia, se avisa
 * por WhatsApp y el plan se activa cuando lo confirman. Por eso acá no hay
 * ninguna pasarela, sino los datos para pagar y el botón que arma el mensaje.
 */
export function BillingPanel({ info, businessName }: { info: BillingInfo; businessName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pidiendo, setPidiendo] = useState<PlanId | null>(null);
  const [elegido, setElegido] = useState<PlanId | null>(null);

  const actual = planOf(info.plan);
  const esperando = info.pendingPlan;

  async function pedir(plan: PlanId) {
    setPidiendo(plan);
    try {
      await api("/api/billing/request", { body: { plan } });
      toast("success", "Listo. Mandanos el comprobante por WhatsApp y lo activamos.");
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "No se pudo registrar el pedido");
    } finally {
      setPidiendo(null);
    }
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    toast("success", "Copiado");
  }

  /* Si ya avisó que pagó, lo único que queda es mandar el comprobante. */
  if (esperando) {
    const spec = planOf(esperando);
    const wa = whatsappLink(
      info.supportPhone,
      `Hola! Soy ${businessName}. Pagué el plan ${spec.name} ($${spec.ars.toLocaleString("es-AR")}). Adjunto el comprobante.`,
    );
    return (
      <section className="card max-w-2xl p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
            <Clock className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-ink-950">
              Estamos esperando tu comprobante
            </h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
              Pediste el plan <strong className="text-ink-800">{spec.name}</strong> por{" "}
              <strong className="text-ink-800">{formatMoney(spec.ars)}</strong>. Mandanos el
              comprobante por WhatsApp y te lo activamos. Mientras tanto seguís en{" "}
              {actual.name}.
            </p>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-coral px-5 text-[14.5px] font-bold text-white transition hover:bg-coral-600"
              >
                <MessageCircle className="size-4.5" />
                Mandar el comprobante
              </a>
            )}
            <p className="mt-3 text-[12px] text-ink-400">
              También podés escribirnos a {WHATSAPP_DISPLAY}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Estado del plan */}
      <section className="card max-w-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-medium text-ink-500">Tu plan</p>
            <p className="font-display mt-0.5 text-[22px] font-extrabold tracking-tight text-ink-950">
              {actual.name}
            </p>
          </div>
          {info.plan !== "free" && info.planExpiresAt && (
            <p className="text-[13px] text-ink-500">
              Vence el <strong className="text-ink-800">{formatDate(info.planExpiresAt)}</strong>
            </p>
          )}
        </div>
      </section>

      {/* Planes */}
      <div className="grid gap-4 lg:grid-cols-3">
        {ORDEN.map((id) => {
          const p = PLANS[id];
          const esActual = info.plan === id;
          const method = info.methods[id];
          const sinMedio = id !== "free" && !method?.link && !method?.alias;

          return (
            <div
              key={id}
              className={cn(
                "card flex flex-col p-6",
                id === "pro" && "border-brand-300 shadow-pop",
                esActual && "ring-2 ring-brand-400",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-[16px] font-bold text-ink-950">{p.name}</h3>
                {esActual && (
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-800">
                    Tu plan
                  </span>
                )}
              </div>
              <p className="mt-3">
                <span className="font-display text-[26px] font-extrabold tracking-tight text-ink-950">
                  {p.ars === 0 ? "$0" : formatMoney(p.ars)}
                </span>
                <span className="ml-1.5 text-[12.5px] text-ink-400">
                  {p.ars === 0 ? "para siempre" : "por mes"}
                </span>
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {resumen(id).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink-600">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand-600" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>

              {id !== "free" && !esActual && (
                <div className="mt-5">
                  {sinMedio ? (
                    <p className="rounded-xl border border-line bg-ink-50/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-500">
                      Escribinos por WhatsApp y coordinamos el pago.
                    </p>
                  ) : elegido === id ? (
                    <div className="space-y-2.5">
                      {method?.link && (
                        <a
                          href={method.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 text-[13.5px] font-bold text-white transition hover:bg-ink-800"
                        >
                          <CreditCard className="size-4" />
                          Pagar con Mercado Pago
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      {method?.alias && (
                        <button
                          onClick={() => copiar(method.alias!)}
                          className="flex w-full items-center gap-2 rounded-xl border border-line-strong/80 bg-white px-3.5 py-2.5 text-left transition hover:border-ink-300"
                        >
                          <Copy className="size-3.5 shrink-0 text-ink-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] text-ink-400">Alias para transferir</span>
                            <span className="block truncate text-[13px] font-semibold text-ink-900">
                              {method.alias}
                            </span>
                            {method.holder && (
                              <span className="block truncate text-[11px] text-ink-400">
                                {method.holder}
                              </span>
                            )}
                          </span>
                        </button>
                      )}
                      <Button
                        variant="brand"
                        className="w-full"
                        loading={pidiendo === id}
                        disabled={!info.canManage}
                        onClick={() => void pedir(id)}
                      >
                        Ya pagué, avisar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant={id === "pro" ? "brand" : "secondary"}
                      className="w-full"
                      disabled={!info.canManage}
                      onClick={() => setElegido(id)}
                    >
                      Pasar a {p.name}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="max-w-2xl text-[12px] leading-relaxed text-ink-400">
        El pago se hace por fuera del sistema y lo confirmamos a mano: no guardamos datos de tu
        tarjeta ni de tu cuenta. Cuando el plan se activa te llega el aviso y lo ves acá.
      </p>
    </div>
  );
}

/** Lo que cambia entre planes, en pocas líneas. */
function resumen(id: PlanId): string[] {
  if (id === "free") {
    return ["1 formulario con QR", "Hasta 100 clientes", "Panel y estadísticas", "Sin campañas"];
  }
  if (id === "pro") {
    return [
      "Formularios y clientes ilimitados",
      "Segmentos y campañas por email",
      "Estadísticas avanzadas y exportación",
    ];
  }
  return [
    "Todo lo de Pro",
    `Campañas por WhatsApp: ${PLANS.business.whatsappIncluded.toLocaleString("es-AR")} mensajes por mes`,
    "Múltiples sucursales, roles y permisos",
  ];
}
