import Link from "next/link";
import { ArrowLeft, Check, QrCode, ScanLine, Users } from "lucide-react";
import { COPY, planPrice } from "@/lib/landing-copy";
import { PLANS } from "@/lib/plans";

const t = COPY.es;

/** Los tres pasos, en una línea cada uno: es lo que hace el producto. */
const STEPS = [
  { icon: QrCode, title: "Ponés un QR en tu local", text: "Con tu marca, listo para imprimir" },
  { icon: ScanLine, title: "El cliente responde y se lleva su beneficio", text: "Treinta segundos, sin bajarse nada" },
  { icon: Users, title: "Tu base se arma sola", text: "Quién es, qué consume y cuándo vuelve" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-offwhite lg:grid-cols-[1fr_minmax(500px,46%)]">
      {/* Formulario */}
      <div className="flex flex-col px-6 py-7 sm:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-inkblack/50 transition-colors hover:text-inkblack"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Volver al inicio
          </Link>
          <Link
            href="/demo"
            className="text-[13px] font-semibold text-coral transition-colors hover:text-coral-600"
          >
            Ver la demo
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>

        <p className="text-center text-xs text-inkblack/40">
          Un producto de <span className="font-semibold text-inkblack/60">Synapse</span> · Hecho para
          comercios que quieren conocer a sus clientes
        </p>
      </div>

      {/* Panel lateral: qué es y qué incluye cada plan */}
      <aside className="relative hidden overflow-hidden bg-inkblack lg:block">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(760px 480px at 15% -10%, rgb(255 90 69 / 0.30), transparent 62%), radial-gradient(680px 480px at 110% 108%, rgb(199 52 24 / 0.28), transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center gap-9 px-12 py-14 xl:px-16">
          <div>
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">
              Qué es SynapBase
            </p>
            <h2 className="display-title mt-3 max-w-[15ch] text-[30px] text-white xl:text-[34px]">
              La base de datos de tus clientes se arma sola
            </h2>
            <p className="body-copy mt-4 max-w-[44ch] text-[14.5px] text-white/55">
              Cientos de personas pasan por tu local todos los meses y no sabés nada de ellas.
              SynapBase convierte ese anonimato en datos que podés usar.
            </p>
          </div>

          <ol className="flex max-w-md flex-col gap-2.5">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 backdrop-blur"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral/20 text-coral">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-white">
                    <span className="mr-1.5 text-coral">{i + 1}.</span>
                    {s.title}
                  </p>
                  <p className="text-[12px] text-white/50">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">
              En qué se diferencian los planes
            </p>
            <div className="mt-3.5 grid max-w-md gap-2.5">
              {t.pricing.plans.map((p) => {
                const { price, period } = planPrice(p, "es");
                /* La diferencia real entre planes es una sola línea cada uno:
                   el detalle completo está en la página de precios. */
                const gist =
                  p.name === "Free"
                    ? "Para probar: un formulario y hasta 100 clientes."
                    : p.name === "Pro"
                      ? "Todo sin límite, con campañas por email."
                      : `Suma campañas por WhatsApp: ${PLANS.business.whatsappIncluded.toLocaleString("es-AR")} mensajes por mes.`;
                return (
                  <div
                    key={p.name}
                    className={`rounded-2xl border px-5 py-3.5 ${
                      p.highlight ? "border-coral/45 bg-coral/10" : "border-white/10 bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13.5px] font-bold text-white">
                        {p.name}
                        {p.highlight && (
                          <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">
                            Más elegido
                          </span>
                        )}
                      </p>
                      <p className="shrink-0 text-[13px] text-white/60">
                        <span className="font-display font-bold text-white">{price}</span>
                        <span className="ml-1 text-[11.5px]">{period}</span>
                      </p>
                    </div>
                    <p className="mt-1 flex items-start gap-1.5 text-[12px] text-white/50">
                      <Check className="mt-0.5 size-3 shrink-0 text-coral" strokeWidth={3} />
                      {gist}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3.5 text-[12px] text-white/35">
              Empezás en Free y cambiás de plan cuando quieras, sin tarjeta.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
