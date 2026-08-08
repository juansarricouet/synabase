import { AlertTriangle, MessageCircle } from "lucide-react";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import { extraMessagePriceArs, messageUsage, planOf } from "@/lib/plans";

/**
 * Consumo de mensajes de WhatsApp del mes.
 *
 * Cada mensaje que sale tiene un costo real del proveedor, así que el comercio
 * necesita verlo antes de que le llegue la factura, no después. Cuando el plan
 * no incluye WhatsApp la tarjeta lo dice en vez de mostrar una barra vacía.
 */
export function MessageQuotaCard({
  used,
  planId,
  className,
}: {
  used: number;
  planId: string;
  className?: string;
}) {
  const plan = planOf(planId);
  const u = messageUsage(used, planId);
  const extra = extraMessagePriceArs();

  if (plan.whatsappIncluded === 0) {
    return (
      <section className={cn("card p-6", className)}>
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight text-ink-950">Mensajes de WhatsApp</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              El plan {plan.name} no incluye envíos por WhatsApp. Las campañas por email no tienen
              tope. Para mandar WhatsApp necesitás el plan Business, que trae{" "}
              {formatNumber(planOf("business").whatsappIncluded)} mensajes por mes.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* Tres estados: tranquilo, cerca del tope y pasado. */
  const state = u.over > 0 ? "over" : u.percent >= 80 ? "warn" : "ok";
  const barColor =
    state === "over" ? "bg-danger-600" : state === "warn" ? "bg-warning-600" : "bg-brand-600";

  return (
    <section className={cn("card p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight text-ink-950">
              Mensajes de WhatsApp
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-500">Este mes, sobre el cupo del plan {plan.name}</p>
          </div>
        </div>
        <p className="tabular text-[13px] text-ink-500">
          <span className="font-display text-[22px] font-extrabold tracking-tight text-ink-950">
            {formatNumber(u.used)}
          </span>
          <span className="ml-1.5">de {formatNumber(u.included)}</span>
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
          style={{ width: `${u.percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        {u.over > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-danger-600">
            <AlertTriangle className="size-3.5" />
            {formatNumber(u.over)} mensajes por encima del cupo
          </span>
        ) : (
          <span className="text-ink-500">
            Te quedan <strong className="text-ink-800">{formatNumber(u.remaining)}</strong> este mes
          </span>
        )}
        <span className="text-ink-400">
          Excedente: {formatMoney(extra)} por mensaje
        </span>
      </div>

      {u.over > 0 && (
        <div className="mt-4 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-[12.5px] leading-relaxed text-danger-600">
          Se te van a facturar <strong>{formatMoney(u.extraCostArs)}</strong> aparte por los{" "}
          {formatNumber(u.over)} mensajes que pasaron el cupo.
        </div>
      )}
    </section>
  );
}
