"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, RANKING_COLORS, cn, formatMonthKey, formatNumber } from "@/lib/utils";

/**
 * Animación de entrada de las series.
 *
 * Recharts la corre una sola vez al montar. `easeOut` frena sobre el final,
 * que es como se mueve el resto del panel. Si el usuario pidió menos
 * movimiento en el sistema, se apaga.
 */
const PREFERS_REDUCED =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ANIM = {
  isAnimationActive: !PREFERS_REDUCED,
  animationDuration: 900,
  animationEasing: "ease-out",
} as const;

/* ————— Card contenedora ————— */

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <section className={cn("card card-hover flex flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-ink-950">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/* ————— Tooltip custom ————— */

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

function SbTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelFormatter?: (l: string | number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
      {label !== undefined && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2 text-[13px] font-medium text-ink-800">
            <span className="size-2 rounded-full" style={{ background: entry.color ?? entry.fill }} />
            {entry.name}:
            <span className="tabular font-semibold text-ink-950">
              {typeof entry.value === "number" ? formatNumber(entry.value) : entry.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

const AXIS = { stroke: "transparent", tickLine: false, axisLine: false } as const;

/* ————— Área: clientes por mes ————— */

export function MonthlyCustomersChart({
  data,
  height = 240,
}: {
  data: { month: string; nuevos: number; recurrentes: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gNuevos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.24} />
            <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="0" stroke="#f0f0f2" vertical={false} />
        <XAxis dataKey="month" {...AXIS} tickFormatter={formatMonthKey} dy={6} interval="preserveStartEnd" />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip content={<SbTooltip labelFormatter={(l) => formatMonthKey(String(l))} />} cursor={{ stroke: "#d6d6dd" }} />
        <Area type="monotone" dataKey="nuevos" name="Nuevos" stroke={CHART_COLORS[0]} strokeWidth={2.2} fill="url(#gNuevos)" dot={false} activeDot={{ r: 4 }} {...ANIM} />
        <Area type="monotone" dataKey="recurrentes" name="Recurrentes" stroke={CHART_COLORS[2]} strokeWidth={2.2} fill="url(#gRec)" dot={false} activeDot={{ r: 4 }} {...ANIM} animationBegin={180} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#6f6f7a" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ————— Barras horizontales: productos ————— */

export function TopProductsChart({ data, height = 240 }: { data: { name: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 18, left: 8, bottom: 0 }} barCategoryGap={7}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          {...AXIS}
          tick={{ fontSize: 12, fill: "#565661" }}
        />
        <Tooltip content={<SbTooltip />} cursor={{ fill: "#f5f5f7" }} />
        <Bar dataKey="count" name="Veces pedido" radius={[0, 6, 6, 0]} maxBarSize={18} {...ANIM}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? CHART_COLORS[0] : "#ffcec3"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ————— Barras verticales genéricas ————— */

type XFormat = "month" | "hour" | "none";

function makeFormatter(format?: XFormat) {
  if (format === "month") return (v: string | number) => formatMonthKey(String(v));
  if (format === "hour") return (v: string | number) => `${v}h`;
  return undefined;
}

export function VBarChart({
  data,
  xKey,
  yKey,
  name,
  color = CHART_COLORS[0],
  height = 220,
  xFormat,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  height?: number;
  xFormat?: XFormat;
}) {
  const tickFormatter = makeFormatter(xFormat);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid stroke="#f0f0f2" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} dy={6} tickFormatter={tickFormatter} interval="preserveStartEnd" />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip content={<SbTooltip labelFormatter={tickFormatter} />} cursor={{ fill: "#f5f5f7" }} />
        <Bar dataKey={yKey} name={name} fill={color} radius={[5, 5, 0, 0]} maxBarSize={26} {...ANIM} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ————— Barras agrupadas: nuevos vs recurrentes / movimiento ————— */

export function GroupedBarsChart({
  data,
  xKey,
  series,
  height = 240,
  xFormat,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  height?: number;
  xFormat?: XFormat;
}) {
  const xFormatter = makeFormatter(xFormat);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }} barCategoryGap={10} barGap={3}>
        <CartesianGrid stroke="#f0f0f2" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} dy={6} tickFormatter={xFormatter} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip content={<SbTooltip labelFormatter={xFormatter} />} cursor={{ fill: "#f5f5f7" }} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[5, 5, 0, 0]} maxBarSize={18} {...ANIM} animationBegin={i * 140} />
        ))}
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#6f6f7a" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ————— Donut ————— */

export function DonutChart({
  data,
  height = 220,
  centerLabel,
}: {
  data: { name: string; value: number }[];
  height?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip content={<SbTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2.5}
            cornerRadius={5}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#6f6f7a" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
        <span className="tabular text-[22px] font-semibold text-ink-950">{formatNumber(total)}</span>
        {centerLabel && <span className="text-[11px] text-ink-400">{centerLabel}</span>}
      </div>
    </div>
  );
}

/* ————— Distribución simple con barras CSS (opciones de encuestas) ————— */

/**
 * Barras horizontales de ranking.
 *
 * Sin `color` explícito, cada barra toma un naranja de RANKING_COLORS: el
 * degradé de intenso a suave refuerza el orden de la lista.
 */
export function OptionBars({ options, color }: { options: { label: string; count: number }[]; color?: string }) {
  const max = Math.max(...options.map((o) => o.count), 1);
  const total = options.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <div className="space-y-2.5">
      {options.map((o, i) => (
        <div key={o.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="truncate font-medium text-ink-700">{o.label}</span>
            <span className="tabular shrink-0 text-ink-400">
              {formatNumber(o.count)} · {Math.round((o.count / total) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(o.count / max) * 100}%`,
                background: color ?? RANKING_COLORS[i % RANKING_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
