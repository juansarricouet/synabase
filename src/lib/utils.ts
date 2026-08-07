import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/* ————— Formatting (es-AR) ————— */

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number, decimals = 0): string {
  return `${n.toLocaleString("es-AR", { maximumFractionDigits: decimals })}%`;
}

const AR_TZ = "America/Argentina/Buenos_Aires";

/**
 * Partes numéricas de una fecha en la zona horaria del comercio.
 *
 * Se arma el texto a mano en lugar de usar `Intl.…format()` directo porque los
 * separadores que devuelve ICU difieren entre Node y el navegador (por ejemplo,
 * espacio duro vs. espacio normal), y esa diferencia rompe la hidratación de
 * React. Los valores numéricos sí son idénticos en todos los motores.
 */
function dateParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    year: get("year"),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: get("minute"),
  };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const p = dateParts(d);
  return `${p.day} ${MONTHS_ES[p.month - 1]?.toLowerCase()} ${p.year}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const p = dateParts(d);
  return `${p.day} ${MONTHS_ES[p.month - 1]?.toLowerCase()} ${p.hour}:${p.minute}`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "—";
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hace 1 día";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months === 1) return "hace 1 mes";
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86400000);
}

export const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** "2026-03" → "Mar 26" */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return `${MONTHS_ES[m - 1]} ${String(y).slice(2)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/**
 * Color estable para avatares y etiquetas, derivado del texto.
 *
 * Son todos tonos de la familia del naranja (rojo-teja → ámbar): alcanzan para
 * distinguir una persona de otra sin sacar al panel de la paleta de la marca.
 */
const AVATAR_HUES = [6, 14, 22, 30, 38, 46, 18, 34];
export function stringHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length]!;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Paleta de gráficos — tonos de naranja de la identidad Synapse.
 *
 * El orden importa: los índices 0 y 2 se dibujan juntos en el gráfico de
 * nuevos vs. recurrentes, así que están lo más separados posible (naranja
 * quemado contra ámbar). El último es un gris cálido, para categorías
 * neutras del tipo "otros".
 */
export const CHART_COLORS = [
  "#c73418", // quemado
  "#ff8a5b", // coral claro
  "#f0a63c", // ámbar
  "#7a2f16", // teja
  "#ff5a45", // coral
  "#ffc98a", // arena
  "#a52c12", // ladrillo
  "#b8ada6", // gris cálido
];

/**
 * Rampa para barras de ranking, del naranja más intenso al más suave.
 *
 * A diferencia de CHART_COLORS —pensada para categorías sin orden, donde lo
 * que importa es distinguirlas— acá el degradé refuerza la posición: la barra
 * más fuerte es la primera. Se cicla si la lista es más larga.
 */
export const RANKING_COLORS = [
  "#b32c14",
  "#c73418",
  "#e04426",
  "#f4623a",
  "#ff8a5b",
  "#ffa87c",
  "#ffc09b",
  "#ffd6bb",
];

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
