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

/** Mismo wordmark que la landing: minúsculas, bold y punto en coral. */
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[19px] font-extrabold tracking-tight text-inkblack ${className}`}>
      synapbase<span className="text-coral">.</span>
    </span>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-offwhite font-sans text-inkblack antialiased lg:grid-cols-[1fr_minmax(480px,44%)]">
      {/* ————— Formulario ————— */}
      <div className="flex flex-col px-6 py-6 sm:px-10 lg:px-14">
        {/* Misma barra que la landing: marca a la izquierda, acciones a la derecha */}
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="group hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-inkblack/50 transition-colors hover:text-inkblack sm:inline-flex"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Inicio
            </Link>
            <Link
              href="/demo"
              className="sheen rounded-lg bg-inkblack px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-inkblack/85"
            >
              Ver la demo
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>

        <p className="text-center text-[11.5px] text-inkblack/35">
          Un producto de <span className="font-semibold text-inkblack/55">Synapse</span> · Hecho para
          comercios que quieren conocer a sus clientes
        </p>
      </div>

      {/* ————— Panel lateral: qué es y qué incluye cada plan ————— */}
      <aside className="relative hidden overflow-hidden bg-inkblack lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(720px 460px at 12% -8%, rgb(255 90 69 / 0.26), transparent 62%), radial-gradient(640px 460px at 112% 106%, rgb(199 52 24 / 0.24), transparent 60%)",
          }}
        />

        <div className="stagger relative flex flex-1 flex-col justify-center gap-8 px-12 py-14 xl:px-16">
          <div>
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">
              01 — Qué es SynapBase
            </p>
            <h2 className="display-title mt-3.5 max-w-[15ch] text-[32px] text-white xl:text-[36px]">
              La base de datos de tus clientes se arma sola
            </h2>
            <p className="body-copy mt-4 max-w-[44ch] text-[14.5px] text-white/50">
              Cientos de personas pasan por tu local todos los meses y no sabés nada de ellas.
              SynapBase convierte ese anonimato en datos que podés usar.
            </p>
          </div>

          <ol className="flex max-w-md flex-col gap-2.5">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-coral/35 hover:bg-white/[0.07]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-coral">
                  <s.icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-white">
                    <span className="numeral mr-1.5 text-[13.5px]">{i + 1}.</span>
                    {s.title}
                  </p>
                  <p className="text-[12px] text-white/45">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">
              02 — En qué se diferencian los planes
            </p>
            <div className="mt-3.5 grid max-w-md gap-2">
              {t.pricing.plans.map((p) => {
                const { price, period } = planPrice(p, "es");
                /* La diferencia real entre planes es una línea cada uno: el
                   detalle completo está en la página de precios. */
                const gist =
                  p.name === "Free"
                    ? "Solo la encuesta y los números, hasta 100 clientes. Sin campañas."
                    : p.name === "Pro"
                      ? "Base sin límite y campañas por email."
                      : `Suma WhatsApp: ${PLANS.business.whatsappIncluded.toLocaleString("es-AR")} mensajes por mes.`;
                return (
                  <div
                    key={p.name}
                    className={`rounded-2xl border px-5 py-3 transition-all duration-300 hover:-translate-y-0.5 ${
                      p.highlight
                        ? "border-coral/45 bg-coral/[0.09] shadow-[0_16px_50px_-30px_rgb(255_90_69/0.8)]"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-[14px] font-bold text-white">
                        {p.name}
                        {p.highlight && (
                          <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Más elegido
                          </span>
                        )}
                      </p>
                      <p className="shrink-0 whitespace-nowrap text-white/50">
                        <span className="font-display text-[15px] font-extrabold tracking-tight text-white">
                          {price}
                        </span>
                        <span className="ml-1 text-[11px]">{period}</span>
                      </p>
                    </div>
                    <p className="mt-1 flex items-start gap-1.5 text-[12px] text-white/45">
                      <Check className="mt-0.5 size-3 shrink-0 text-coral" strokeWidth={3} />
                      {gist}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] text-white/30">
              Empezás en Free y cambiás de plan cuando quieras, sin tarjeta.
            </p>
          </div>
        </div>

        {/* Misma cinta de la landing, para que el sector no se sienta aparte */}
        <div className="relative border-t border-white/10 py-4">
          <div className="marquee">
            <div>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                  {t.marquee.map((label) => (
                    <span key={label} className="flex items-center whitespace-nowrap">
                      <span className="font-display px-6 text-[12.5px] font-bold tracking-tight text-white/40">
                        {label}
                      </span>
                      <span className="size-1 shrink-0 rounded-full bg-coral" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
