import Link from "next/link";
import { ArrowRight, Lock, TrendingUp } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { planOf } from "@/lib/plans";
import type { AvisoDeUso } from "@/server/plan-limits";

/**
 * Cartel para una sección que el plan actual no incluye.
 *
 * Reemplaza al contenido en vez de dejarlo a medias: mostrar la herramienta y
 * que después falle al usarla es peor que decirlo de entrada.
 */
export function PlanGate({
  plan,
  necesita,
  titulo,
  children,
  basePath = "/app",
}: {
  plan: string;
  /** Plan mínimo que habilita la sección. */
  necesita: "pro" | "business";
  titulo: string;
  children: React.ReactNode;
  basePath?: string;
}) {
  const requerido = planOf(necesita);
  return (
    <div className="card mx-auto max-w-xl p-10 text-center animate-fade-up">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Lock className="size-5" strokeWidth={1.75} />
      </span>
      <h2 className="font-display mt-5 text-[21px] font-extrabold tracking-[-0.028em] text-ink-950">
        {titulo}
      </h2>
      <p className="body-copy mx-auto mt-2.5 max-w-[46ch] text-[14px] text-ink-500">{children}</p>
      <p className="mt-5 text-[13px] text-ink-400">
        Hoy estás en <strong className="text-ink-700">{planOf(plan).name}</strong>. Se habilita con{" "}
        <strong className="text-ink-700">{requerido.name}</strong>, ${requerido.ars.toLocaleString("es-AR")} por
        mes.
      </p>
      <Link
        href={`${basePath}/ajustes?tab=facturacion`}
        className="group mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 text-[14.5px] font-bold text-white transition hover:bg-brand-700"
      >
        Ver los planes
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/**
 * Aviso de que la base se está acercando al tope del plan.
 *
 * Es sólo un aviso: pasarse no borra ni esconde ningún cliente. Los datos son
 * del comercio y de su gente, y retenerlos para forzar un pago no corresponde.
 */
export function UsageWarning({
  uso,
  plan,
  basePath = "/app",
}: {
  uso: AvisoDeUso;
  plan: string;
  basePath?: string;
}) {
  if (!uso.mostrar || uso.max == null) return null;

  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-center gap-3.5 rounded-2xl border px-5 py-4",
        uso.excedido
          ? "border-warning-600/40 bg-warning-50"
          : "border-brand-200/70 bg-brand-50/60",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-card",
          uso.excedido ? "text-warning-600" : "text-brand-600",
        )}
      >
        <TrendingUp className="size-4.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink-950">
          {uso.excedido
            ? `Tenés ${formatNumber(uso.clientes)} clientes y el plan ${planOf(plan).name} cubre ${formatNumber(uso.max)}`
            : `Vas ${formatNumber(uso.clientes)} de ${formatNumber(uso.max)} clientes`}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">
          {uso.excedido
            ? "Seguimos guardando todo: no perdiste ni vas a perder ningún cliente. Pasá a Pro para sacarle provecho con segmentos y campañas."
            : "Cuando llegues al tope vas a poder seguir capturando igual, pero conviene pasar a Pro para segmentar y mandar campañas."}
        </p>
      </div>
      <Link
        href={`${basePath}/ajustes?tab=facturacion`}
        className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-brand-700"
      >
        Ver planes
      </Link>
    </div>
  );
}
