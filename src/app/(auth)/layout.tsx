import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { SynapseNetwork } from "@/components/landing/SynapseNetwork";
import { COPY, planPrice } from "@/lib/landing-copy";
import { PLANS } from "@/lib/plans";

const t = COPY.es;

/** Alturas de las barritas del panel flotante, en porcentaje. */
const BARS = [22, 30, 26, 41, 38, 52, 47, 63, 58, 76, 71, 94];

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
    <div className="grid min-h-dvh bg-offwhite font-sans text-inkblack antialiased lg:grid-cols-[1fr_minmax(460px,42%)]">
      {/* ————— Formulario ————— */}
      <div className="flex min-w-0 flex-col px-6 py-6 sm:px-10 lg:px-14">
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

      {/* ————— Panel de marca ————— */}
      <aside className="relative hidden min-w-0 overflow-hidden bg-inkblack lg:flex lg:flex-col lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(680px 460px at 60% 8%, rgb(255 90 69 / 0.22), transparent 60%), radial-gradient(520px 400px at 5% 100%, rgb(199 52 24 / 0.2), transparent 62%)",
          }}
        />

        <div className="stagger relative px-12 py-14 xl:px-14">
          <p className="font-display text-[13px] font-bold tracking-tight text-coral">
            Un producto de synapse.
          </p>
          <h2 className="display-title mt-3.5 max-w-[14ch] text-[32px] text-white xl:text-[36px]">
            Cada visita, una conexión más
          </h2>

          {/* La red de la marca, dibujándose sola */}
          <div className="relative mt-2">
            <SynapseNetwork className="mx-auto max-w-[420px]" />

            {/* Ficha flotante: el resultado de todas esas conexiones */}
            <div className="absolute -bottom-2 left-0 w-[224px] rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">
                Tu base hoy
              </p>
              <AnimatedNumber
                value={1248}
                duration={1600}
                className="font-display mt-1 block text-[30px] font-extrabold leading-none tracking-[-0.03em] text-white"
              />
              <p className="mt-1 text-[12px] text-white/45">clientes con nombre</p>
              <div className="mt-3 flex h-9 items-end gap-[3px]">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className="syn-bar flex-1 rounded-[2px]"
                    style={{
                      height: `${h}%`,
                      background: i >= BARS.length - 3 ? "var(--color-coral)" : "rgb(255 255 255 / 0.22)",
                      ["--i" as string]: i,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="body-copy mt-12 max-w-[42ch] text-[14.5px] text-white/50">
            Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume y
            cuándo vuelve. Sin planillas. Sin adivinar.
          </p>

          {/* Los planes, en una tira compacta */}
          <div className="mt-8">
            <p className="font-display text-[12px] font-bold tracking-tight text-coral">
              En qué se diferencian los planes
            </p>
            <div className="mt-3 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {t.pricing.plans.map((p) => {
                const { price, period } = planPrice(p, "es");
                /* Una línea por plan: el detalle completo vive en /#precios. */
                const gist =
                  p.name === "Free"
                    ? "Solo la encuesta y los números, hasta 100 clientes"
                    : p.name === "Pro"
                      ? "Base sin límite y campañas por email"
                      : `Suma WhatsApp: ${PLANS.business.whatsappIncluded.toLocaleString("es-AR")} mensajes por mes`;
                return (
                  <div
                    key={p.name}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      p.highlight ? "bg-coral/[0.09]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${p.highlight ? "bg-coral" : "bg-white/25"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[13px] font-bold text-white">{p.name}</p>
                      <p className="truncate text-[11.5px] text-white/40">{gist}</p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-right">
                      <span className="font-display text-[14px] font-extrabold tracking-tight text-white">
                        {price}
                      </span>
                      <span className="ml-1 text-[10.5px] text-white/40">{period}</span>
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
      </aside>
    </div>
  );
}
