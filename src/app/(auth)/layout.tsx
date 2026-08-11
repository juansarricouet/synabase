import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { COPY, planPrice } from "@/lib/landing-copy";
import { PLANS } from "@/lib/plans";

const t = COPY.es;

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

      {/*
        ————— Panel de marca —————

        Negro plano y quieto, a propósito. Antes tenía la red de sinapsis
        dibujándose sola y una ficha con números subiendo: se veía complicado,
        que es lo contrario de lo que se vende acá. Lo que queda se entiende de
        una sola lectura, sin que nada se mueva.
      */}
      <aside className="relative hidden min-w-0 overflow-hidden bg-inkblack lg:flex lg:flex-col lg:justify-center">
        <div className="relative px-12 py-14 xl:px-14">
          <a
            href="https://www.synapse.place/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[13px] font-bold tracking-tight text-white/45 transition-colors hover:text-white"
          >
            Un producto de synapse.
          </a>
          <h2 className="display-title mt-3.5 max-w-[14ch] text-[32px] text-white xl:text-[36px]">
            Cada visita, un cliente con nombre
          </h2>

          <p className="body-copy mt-5 max-w-[42ch] text-[14.5px] text-white/50">
            Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume y
            cuándo vuelve. Sin planillas. Sin adivinar.
          </p>

          {/* Los tres pasos, que es todo lo que hay que entender para empezar. */}
          <ol className="mt-10 space-y-5">
            {[
              ["Pegás el QR en tu local", "Te lo damos listo para imprimir."],
              ["El cliente responde y se lleva su descuento", "Treinta segundos desde su celular."],
              ["Te quedás con el dato", "Su nombre, qué consumió y cuándo volvió."],
            ].map(([titulo, detalle], i) => (
              <li key={titulo} className="flex gap-4">
                <span className="font-display mt-px flex size-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-[12px] font-bold text-white/70">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white">{titulo}</p>
                  <p className="mt-0.5 text-[13px] text-white/40">{detalle}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Los planes, en una tira compacta */}
          <div className="mt-10">
            <p className="font-display text-[12px] font-bold tracking-tight text-white/45">
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
                      p.highlight ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${p.highlight ? "bg-white/70" : "bg-white/25"}`}
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
