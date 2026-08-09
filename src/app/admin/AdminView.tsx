"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client";
import { cn, daysSince, formatDate, formatMoney, formatNumber } from "@/lib/utils";
import { planOf } from "@/lib/plans";
import type { AdminBusiness } from "@/server/services/billing";

type Filtro = "todos" | "esperando" | "pagos" | "vencidos";

/** Días de tolerancia antes de marcar un plan como vencido en la lista. */
const GRACIA = 0;

type Estado = "esperando" | "vencido" | "por-vencer" | "al-dia" | "free";

function estado(b: AdminBusiness): Estado {
  if (b.pending_payment_id) return "esperando" as const;
  if (b.plan === "free") return "free" as const;
  const dias = b.plan_expires_at ? -(daysSince(b.plan_expires_at) ?? 0) : null;
  if (dias != null && dias < -GRACIA) return "vencido" as const;
  if (dias != null && dias <= 5) return "por-vencer" as const;
  return "al-dia" as const;
}

export function AdminView({ businesses }: { businesses: AdminBusiness[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [confirmar, setConfirmar] = useState<AdminBusiness | null>(null);
  const [rechazar, setRechazar] = useState<AdminBusiness | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtrados = businesses.filter((b) => {
      if (
        q &&
        !b.name.toLowerCase().includes(q) &&
        !(b.owner_email ?? "").toLowerCase().includes(q) &&
        !(b.owner_name ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      const e = estado(b);
      if (filtro === "esperando") return e === "esperando";
      if (filtro === "pagos") return b.plan !== "free";
      if (filtro === "vencidos") return e === "vencido" || e === "por-vencer";
      return true;
    });
    /* Lo que espera confirmación va primero: es lo único accionable. */
    return filtrados.sort((a, b) => {
      const pa = a.pending_payment_id ? 0 : 1;
      const pb = b.pending_payment_id ? 0 : 1;
      return pa - pb || b.created_at.localeCompare(a.created_at);
    });
  }, [businesses, busca, filtro]);

  const kpis = useMemo(() => {
    const esperando = businesses.filter((b) => b.pending_payment_id).length;
    const pagos = businesses.filter((b) => b.plan !== "free");
    const mrr = pagos.reduce((t, b) => t + planOf(b.plan).ars, 0);
    const vencidos = businesses.filter((b) => estado(b) === "vencido").length;
    return { total: businesses.length, esperando, pagos: pagos.length, mrr, vencidos };
  }, [businesses]);

  async function resolver(b: AdminBusiness, action: "confirmar" | "rechazar") {
    if (!b.pending_payment_id) return;
    setOcupado(true);
    try {
      await api(`/api/admin/payments/${b.pending_payment_id}`, { body: { action } });
      toast("success", action === "confirmar" ? "Pago confirmado y plan activado" : "Pago rechazado");
      setConfirmar(null);
      setRechazar(null);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "No se pudo resolver");
    } finally {
      setOcupado(false);
    }
  }

  async function cambiarPlan(b: AdminBusiness, plan: string) {
    try {
      await api("/api/admin/plan", { body: { businessId: b.id, plan } });
      toast("success", `${b.name} pasó a ${planOf(plan).name}`);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "No se pudo cambiar");
    }
  }

  const FILTROS: { id: Filtro; label: string; n?: number }[] = [
    { id: "todos", label: "Todos", n: kpis.total },
    { id: "esperando", label: "Esperando confirmación", n: kpis.esperando },
    { id: "pagos", label: "Con plan pago", n: kpis.pagos },
    { id: "vencidos", label: "Vencidos o por vencer" },
  ];

  return (
    <div>
      {/* Resumen */}
      <div className="stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Kpi icon={<Building2 className="size-4" />} label="Comercios" value={formatNumber(kpis.total)} />
        <Kpi
          icon={<Clock className="size-4" />}
          label="Esperando confirmación"
          value={formatNumber(kpis.esperando)}
          alerta={kpis.esperando > 0}
        />
        <Kpi icon={<Users className="size-4" />} label="Con plan pago" value={formatNumber(kpis.pagos)} />
        <Kpi icon={<Wallet className="size-4" />} label="Facturación mensual" value={formatMoney(kpis.mrr)} />
      </div>

      {/* Controles */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por comercio, dueño o email…"
            className="h-9.5 w-full rounded-[10px] border border-line-strong/80 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all",
                filtro === f.id
                  ? "border-ink-950 bg-ink-950 text-white shadow-raised"
                  : "border-line-strong/80 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900",
              )}
            >
              {f.label}
              {f.n != null && <span className="ml-1.5 opacity-60">{f.n}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4 space-y-3">
        {lista.map((b) => {
          const e = estado(b);
          return (
            <div
              key={b.id}
              className={cn(
                "card p-5 transition-shadow",
                e === "esperando" && "border-warning-600/40 bg-warning-50/40 shadow-raised",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[16px] font-bold tracking-tight text-ink-950">
                      {b.name}
                    </h3>
                    <EstadoBadge estado={e} />
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                      {planOf(b.plan).name}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {b.owner_name ?? "Sin dueño"}
                    {b.owner_email && (
                      <>
                        {" · "}
                        <a href={`mailto:${b.owner_email}`} className="text-brand-700 hover:underline">
                          {b.owner_email}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-400">
                    {formatNumber(b.customers)} clientes · {formatNumber(b.submissions)} registros ·
                    alta {formatDate(b.created_at)}
                    {b.plan !== "free" && b.plan_expires_at && (
                      <> · vence {formatDate(b.plan_expires_at)}</>
                    )}
                  </p>
                </div>

                {/* Acciones */}
                {b.pending_payment_id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="mr-1 text-[13px] text-ink-600">
                      Pidió <strong>{planOf(b.pending_plan ?? "").name}</strong> ·{" "}
                      {b.pending_amount != null && formatMoney(b.pending_amount)}
                    </p>
                    <Button variant="secondary" onClick={() => setRechazar(b)}>
                      <X className="size-3.5" />
                      Rechazar
                    </Button>
                    <Button variant="brand" onClick={() => setConfirmar(b)}>
                      <Check className="size-4" />
                      Confirmar pago
                    </Button>
                  </div>
                ) : (
                  <select
                    value={b.plan}
                    onChange={(e) => void cambiarPlan(b, e.target.value)}
                    className="h-9 rounded-[10px] border border-line-strong/80 bg-white px-2.5 text-[13px] text-ink-700 outline-none transition focus:border-brand-500"
                    title="Cambiar el plan a mano"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}

        {lista.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-[15px] font-medium text-ink-700">Nada por acá</p>
            <p className="mt-1 text-[13.5px] text-ink-400">
              {businesses.length === 0
                ? "Todavía no se registró ningún comercio."
                : "Ningún comercio coincide con el filtro."}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={() => confirmar && void resolver(confirmar, "confirmar")}
        danger={false}
        loading={ocupado}
        confirmLabel="Sí, entró el dinero"
        title={`¿Confirmar el pago de ${confirmar?.name}?`}
        description={`Se le activa el plan ${planOf(confirmar?.pending_plan ?? "").name} por 30 días. Antes de confirmar, chequeá en Mercado Pago que el dinero haya entrado.`}
      />

      <ConfirmModal
        open={!!rechazar}
        onClose={() => setRechazar(null)}
        onConfirm={() => rechazar && void resolver(rechazar, "rechazar")}
        loading={ocupado}
        confirmLabel="Rechazar"
        title={`¿Rechazar el pago de ${rechazar?.name}?`}
        description="El comercio queda en el plan que tenía. Conviene avisarle por qué."
      />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  alerta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alerta?: boolean;
}) {
  return (
    <div className={cn("card lift p-4.5", alerta && "border-warning-600/40 bg-warning-50/50")}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          alerta ? "bg-warning-100 text-warning-600" : "bg-brand-50 text-brand-600",
        )}
      >
        {icon}
      </span>
      <p className="tabular font-display mt-3 text-[24px] font-extrabold leading-none tracking-[-0.03em] text-ink-950">
        {value}
      </p>
      <p className="mt-1.5 text-[12.5px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const map = {
    esperando: { txt: "Esperando confirmación", cls: "bg-warning-100 text-warning-600", icon: Clock },
    vencido: { txt: "Vencido", cls: "bg-danger-100 text-danger-600", icon: AlertTriangle },
    "por-vencer": { txt: "Vence pronto", cls: "bg-warning-100 text-warning-600", icon: Clock },
    "al-dia": { txt: "Al día", cls: "bg-success-100 text-green-800", icon: Check },
    free: { txt: "Free", cls: "bg-ink-100 text-ink-500", icon: Building2 },
  } as const;
  const s = map[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        s.cls,
      )}
    >
      <s.icon className="size-3" />
      {s.txt}
    </span>
  );
}
