import {
  BarChart3,
  Check,
  MessageCircle,
  QrCode,
  ScanLine,
  Send,
  Star,
  Users,
} from "lucide-react";
import type { Lang } from "@/lib/landing-copy";

/**
 * Maquetas de producto en marco de ventana, con línea fina y un nodo en coral.
 * Las animaciones se disparan solas al entrar en pantalla (ver ScrollReveal).
 *
 * Todo lo que tiene ancho fijo va con `min-w-0` o medidas que achican en
 * celular: si una pieza es más ancha que la pantalla, estira la grilla de la
 * sección y le corta el texto al bloque de al lado.
 */

/** Textos de las maquetas. Son pocos, así que viven acá y no en el diccionario. */
const T = {
  es: {
    qr: "QR",
    scan: "Escanea",
    answer: "Responde",
    record: "Ficha",
    newTag: "NUEVO",
    order: "Hamburguesa doble",
    visits: "Visitas",
    every: "Vuelve cada",
    everyValue: "8 días",
    spent: "Gastó",
    customerSince: "Cliente desde hace 7 meses",
    products: ["Hamburguesa doble", "Cerveza IPA", "Papas cheddar"],
    segment: "Segmento",
    message: "Mensaje",
    comeBack: "Vuelven",
    bubble1: <>Hola <strong>Juan</strong> 👋 Volvió tu <strong>hamburguesa doble</strong>. Esta semana, 2x1 mostrando este mensaje.</>,
    bubble2: <><strong>María</strong>, hace 40 días que no venís. Te guardamos un 15% ❤️</>,
    sentTo: "Enviado a",
    sentToRest: "del segmento",
    recipients: "124 clientes",
    kpis: ["Clientes", "Nuevos este mes", "Tasa de retorno", "Escaneos"],
    byMonth: "Clientes por mes",
    latest: "Últimos registros",
    rows: ["Juan · Hamburguesa", "Sofía · Flat white", "Martín · Cerveza IPA"],
  },
  en: {
    qr: "QR",
    scan: "Scan",
    answer: "Answer",
    record: "Record",
    newTag: "NEW",
    order: "Double burger",
    visits: "Visits",
    every: "Returns every",
    everyValue: "8 days",
    spent: "Spent",
    customerSince: "Customer for 7 months",
    products: ["Double burger", "IPA beer", "Cheddar fries"],
    segment: "Segment",
    message: "Message",
    comeBack: "They return",
    bubble1: <>Hi <strong>Juan</strong> 👋 Your <strong>double burger</strong> is back. This week, 2-for-1 if you show this message.</>,
    bubble2: <><strong>María</strong>, it&apos;s been 40 days. We saved you 15% off ❤️</>,
    sentTo: "Sent to",
    sentToRest: "in the segment",
    recipients: "124 customers",
    kpis: ["Customers", "New this month", "Return rate", "Scans"],
    byMonth: "Customers per month",
    latest: "Latest sign-ups",
    rows: ["Juan · Burger", "Sofía · Flat white", "Martín · IPA beer"],
  },
} as const;

function Window({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mock overflow-hidden rounded-2xl border border-inkblack/15 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-inkblack/10 px-4 py-3">
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
      </div>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

function Node({
  icon: Icon,
  label,
  n,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  n: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`mock-node mock-node-${n} flex min-w-0 flex-1 basis-0 flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-center sm:max-w-[92px] sm:px-2 ${
        accent ? "border-coral bg-coral text-white" : "border-inkblack/20 bg-white text-inkblack"
      }`}
    >
      <Icon className="size-4.5 shrink-0" strokeWidth={1.75} />
      {/* Achica en celular en vez de recortar: las etiquetas son una sola
          palabra, así que un `truncate` se las comería a la mitad. */}
      <span className="w-full text-[9.5px] font-semibold leading-tight sm:text-[11px]">{label}</span>
    </div>
  );
}

function Connector() {
  return (
    <svg viewBox="0 0 40 2" className="h-0.5 w-3 shrink-0 sm:w-6 lg:w-8" preserveAspectRatio="none">
      <line
        x1="0" y1="1" x2="40" y2="1"
        className="mock-line"
        style={{ ["--dash" as string]: "40" }}
        stroke="#111111" strokeOpacity="0.35" strokeWidth="2"
      />
    </svg>
  );
}

/** 01 — El flujo de captura: escaneo → formulario → ficha de cliente. */
export function CaptureMock({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <Window>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Node icon={QrCode} label={t.qr} n={1} />
        <Connector />
        <Node icon={ScanLine} label={t.scan} n={2} />
        <Connector />
        <Node icon={Check} label={t.answer} n={3} accent />
        <Connector />
        <Node icon={Users} label={t.record} n={4} />
      </div>
      <div className="mt-7 rounded-xl border border-inkblack/12 bg-offwhite p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral/12 text-[12px] font-bold text-coral">
            JP
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-inkblack">Juan Pérez</p>
            <p className="truncate text-[11.5px] text-inkblack/50">{t.order} · 11 5555 0100</p>
          </div>
          <span className="shrink-0 rounded-full bg-inkblack px-2.5 py-1 text-[10px] font-bold text-white">
            {t.newTag}
          </span>
        </div>
      </div>
    </Window>
  );
}

/** 02 — La ficha viva: métricas que se llenan solas. */
export function ProfileMock({ lang }: { lang: Lang }) {
  const t = T[lang];
  const stats = [
    { label: t.visits, value: "12" },
    { label: t.every, value: t.everyValue },
    { label: t.spent, value: "$84.200" },
  ];
  return (
    <Window>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral/12 text-[13px] font-bold text-coral">
          MG
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-inkblack">María González</p>
          <p className="truncate text-[12px] text-inkblack/50">{t.customerSince}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-coral/30 bg-coral/8 px-2.5 py-1 text-[10px] font-bold text-coral">
          VIP
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`mock-node mock-node-${i + 1} min-w-0 rounded-xl border border-inkblack/12 bg-offwhite p-2.5 sm:p-3`}
          >
            <p className="truncate text-[15px] font-bold tracking-tight text-inkblack sm:text-[17px]">{s.value}</p>
            <p className="mt-0.5 truncate text-[10.5px] text-inkblack/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {t.products.map((label, i) => {
          const w = ["86%", "54%", "31%"][i]!;
          return (
            <div key={label}>
              <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
                <span className="truncate font-medium text-inkblack/70">{label}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-inkblack/8">
                <div
                  className="mock-bar h-full rounded-full"
                  style={{
                    ["--w" as string]: w,
                    width: w,
                    background: i === 0 ? "var(--color-coral)" : "rgb(17 17 17 / 0.28)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Window>
  );
}

/** 03 — La campaña que trae gente de vuelta. */
export function CampaignMock({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <Window>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Node icon={Users} label={t.segment} n={1} />
        <Connector />
        <Node icon={Send} label={t.message} n={2} accent />
        <Connector />
        <Node icon={BarChart3} label={t.comeBack} n={3} />
      </div>

      <div className="mt-7 space-y-2.5">
        <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-4 py-2.5 text-[12.5px] leading-relaxed text-inkblack">
          {t.bubble1}
        </div>
        <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-4 py-2.5 text-[12.5px] leading-relaxed text-inkblack">
          {t.bubble2}
        </div>
        <div className="flex items-center gap-2 pt-1.5 text-[11.5px] text-inkblack/45">
          <MessageCircle className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">
            {t.sentTo} <strong className="text-inkblack/70">{t.recipients}</strong> {t.sentToRest}
          </span>
          <span className="caret ml-auto inline-block size-1.5 shrink-0 rounded-full bg-coral" />
        </div>
      </div>
    </Window>
  );
}

/** Panel resumido para el hero. */
export function HeroMock({ lang }: { lang: Lang }) {
  const t = T[lang];
  const bars = [34, 44, 38, 58, 52, 70, 64, 84, 78, 92, 88, 100];
  const kpis = [
    [t.kpis[0], "1.248", Users],
    [t.kpis[1], "+86", Star],
    [t.kpis[2], "58%", BarChart3],
    [t.kpis[3], "3.402", ScanLine],
  ] as const;

  return (
    <div className="mock overflow-hidden rounded-[20px] border border-inkblack/15 bg-white shadow-[0_30px_80px_-40px_rgb(17_17_17/0.35)]">
      <div className="flex items-center gap-1.5 border-b border-inkblack/10 px-4 py-3">
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="ml-3 truncate rounded-md bg-offwhite px-2.5 py-1 text-[10px] text-inkblack/40">
          synapbase.app · Café Martina
        </span>
      </div>

      <div className="p-4 sm:p-5 lg:p-7">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {kpis.map(([label, value, Icon], i) => (
            <div
              key={label}
              className={`mock-node mock-node-${i + 1} min-w-0 rounded-xl border border-inkblack/12 bg-offwhite p-3 text-left sm:p-3.5`}
            >
              <Icon className={`size-4 ${i === 1 ? "text-coral" : "text-inkblack/40"}`} strokeWidth={1.75} />
              <p className="mt-2 text-[19px] font-bold leading-none tracking-tight text-inkblack sm:text-[20px]">
                {value}
              </p>
              <p className="mt-1.5 truncate text-[10.5px] text-inkblack/50">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 rounded-xl border border-inkblack/12 bg-white p-3.5 sm:p-4">
            <p className="text-[11.5px] font-bold text-inkblack/70">{t.byMonth}</p>
            <div className="mt-3 flex h-[92px] items-end gap-1.5 sm:h-[104px]">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="mock-bar min-w-0 flex-1 rounded-t-[3px]"
                  style={{
                    height: `${h}%`,
                    width: "100%",
                    background: i >= bars.length - 3 ? "var(--color-coral)" : "rgb(17 17 17 / 0.14)",
                    animationDelay: `${i * 0.045}s`,
                    ["--w" as string]: "100%",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-inkblack/12 bg-white p-3.5 sm:p-4">
            <p className="text-[11.5px] font-bold text-inkblack/70">{t.latest}</p>
            <div className="mt-3 space-y-2.5">
              {t.rows.map((text, i) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-coral/12 text-[8px] font-bold text-coral">
                    {["JP", "SL", "MR"][i]}
                  </span>
                  <span className="truncate text-[10.5px] text-inkblack/60">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
