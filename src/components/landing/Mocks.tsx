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

/**
 * Maquetas de producto en marco de ventana, con línea fina y un nodo en coral.
 * Las animaciones se disparan solas al entrar en pantalla (ver ScrollReveal).
 */

function Window({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mock overflow-hidden rounded-2xl border border-inkblack/15 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-inkblack/10 px-4 py-3">
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
      </div>
      <div className="p-6 sm:p-8">{children}</div>
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
      className={`mock-node mock-node-${n} flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center ${
        accent ? "border-coral bg-coral text-white" : "border-inkblack/20 bg-white text-inkblack"
      }`}
    >
      <Icon className="size-4.5" strokeWidth={1.75} />
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </div>
  );
}

function Connector() {
  return (
    <svg viewBox="0 0 40 2" className="h-0.5 w-5 shrink-0 sm:w-8" preserveAspectRatio="none">
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
export function CaptureMock() {
  return (
    <Window>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Node icon={QrCode} label="QR" n={1} />
        <Connector />
        <Node icon={ScanLine} label="Escanea" n={2} />
        <Connector />
        <Node icon={Check} label="Responde" n={3} accent />
        <Connector />
        <Node icon={Users} label="Ficha" n={4} />
      </div>
      <div className="mt-7 rounded-xl border border-inkblack/12 bg-offwhite p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-coral/12 text-[12px] font-bold text-coral">
            JP
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-inkblack">Juan Pérez</p>
            <p className="text-[11.5px] text-inkblack/50">Hamburguesa doble · 11 5555 0100</p>
          </div>
          <span className="rounded-full bg-inkblack px-2.5 py-1 text-[10px] font-bold text-white">
            NUEVO
          </span>
        </div>
      </div>
    </Window>
  );
}

/** 02 — La ficha viva: métricas que se llenan solas. */
export function ProfileMock() {
  const stats = [
    { label: "Visitas", value: "12" },
    { label: "Vuelve cada", value: "8 días" },
    { label: "Gastó", value: "$84.200" },
  ];
  return (
    <Window>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-coral/12 text-[13px] font-bold text-coral">
          MG
        </span>
        <div>
          <p className="text-[15px] font-bold text-inkblack">María González</p>
          <p className="text-[12px] text-inkblack/50">Cliente desde hace 7 meses</p>
        </div>
        <span className="ml-auto rounded-full border border-coral/30 bg-coral/8 px-2.5 py-1 text-[10px] font-bold text-coral">
          VIP
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {stats.map((s, i) => (
          <div key={s.label} className={`mock-node mock-node-${i + 1} rounded-xl border border-inkblack/12 bg-offwhite p-3`}>
            <p className="text-[17px] font-bold tracking-tight text-inkblack">{s.value}</p>
            <p className="mt-0.5 text-[10.5px] text-inkblack/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {[
          { label: "Hamburguesa doble", w: "86%" },
          { label: "Cerveza IPA", w: "54%" },
          { label: "Papas cheddar", w: "31%" },
        ].map((p, i) => (
          <div key={p.label}>
            <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
              <span className="font-medium text-inkblack/70">{p.label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-inkblack/8">
              <div
                className="mock-bar h-full rounded-full"
                style={{
                  ["--w" as string]: p.w,
                  width: p.w,
                  background: i === 0 ? "var(--color-coral)" : "rgb(17 17 17 / 0.28)",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Window>
  );
}

/** 03 — La campaña que trae gente de vuelta. */
export function CampaignMock() {
  return (
    <Window>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Node icon={Users} label="Segmento" n={1} />
        <Connector />
        <Node icon={Send} label="Mensaje" n={2} accent />
        <Connector />
        <Node icon={BarChart3} label="Vuelven" n={3} />
      </div>

      <div className="mt-7 space-y-2.5">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-4 py-2.5 text-[12.5px] leading-relaxed text-inkblack">
          Hola <strong>Juan</strong> 👋 Volvió tu <strong>hamburguesa doble</strong>. Esta semana,
          2x1 mostrando este mensaje.
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-4 py-2.5 text-[12.5px] leading-relaxed text-inkblack">
          <strong>María</strong>, hace 40 días que no venís. Te guardamos un 15% ❤️
        </div>
        <div className="flex items-center gap-2 pt-1.5 text-[11.5px] text-inkblack/45">
          <MessageCircle className="size-3.5" />
          <span>
            Enviado a <strong className="text-inkblack/70">124 clientes</strong> del segmento
          </span>
          <span className="caret ml-auto inline-block size-1.5 rounded-full bg-coral" />
        </div>
      </div>
    </Window>
  );
}

/** Panel resumido para el hero. */
export function HeroMock() {
  const bars = [34, 44, 38, 58, 52, 70, 64, 84, 78, 92, 88, 100];
  return (
    <div className="mock overflow-hidden rounded-[20px] border border-inkblack/15 bg-white shadow-[0_30px_80px_-40px_rgb(17_17_17/0.35)]">
      <div className="flex items-center gap-1.5 border-b border-inkblack/10 px-4 py-3">
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="size-2 rounded-full bg-inkblack/15" />
        <span className="ml-3 rounded-md bg-offwhite px-2.5 py-1 text-[10px] text-inkblack/40">
          synapbase.app · Café Martina
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Clientes", "1.248", Users],
            ["Nuevos este mes", "+86", Star],
            ["Tasa de retorno", "58%", BarChart3],
            ["Escaneos", "3.402", ScanLine],
          ].map(([label, value, Icon], i) => {
            const I = Icon as React.ElementType;
            return (
              <div
                key={String(label)}
                className={`mock-node mock-node-${i + 1} rounded-xl border border-inkblack/12 bg-offwhite p-3.5 text-left`}
              >
                <I className={`size-4 ${i === 1 ? "text-coral" : "text-inkblack/40"}`} strokeWidth={1.75} />
                <p className="mt-2 text-[20px] font-bold leading-none tracking-tight text-inkblack">
                  {String(value)}
                </p>
                <p className="mt-1.5 text-[10.5px] text-inkblack/50">{String(label)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.6fr_1fr]">
          <div className="rounded-xl border border-inkblack/12 bg-white p-4">
            <p className="text-[11.5px] font-bold text-inkblack/70">Clientes por mes</p>
            <div className="mt-3 flex h-[104px] items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="mock-bar flex-1 rounded-t-[3px]"
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
          <div className="rounded-xl border border-inkblack/12 bg-white p-4">
            <p className="text-[11.5px] font-bold text-inkblack/70">Últimos registros</p>
            <div className="mt-3 space-y-2.5">
              {[
                ["JP", "Juan · Hamburguesa"],
                ["SL", "Sofía · Flat white"],
                ["MR", "Martín · Cerveza IPA"],
              ].map(([ini, text]) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-coral/12 text-[8px] font-bold text-coral">
                    {ini}
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
