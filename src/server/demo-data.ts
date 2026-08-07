import "server-only";
import crypto from "node:crypto";
import type {
  Business,
  Campaign,
  DashboardStats,
  Form,
  Question,
  Segment,
  SegmentRule,
  SubmissionRow,
  Tag,
} from "@/lib/types";
import type { AnalyticsData } from "@/server/services/stats";
import type { CustomerFacts, CustomerHistoryEntry } from "@/server/services/customers";
import { matchesRule } from "@/server/services/segments";

/**
 * Café Martina, pero 100% en memoria y sin base de datos.
 *
 * Genera el mismo comercio de demostración que el seed, pero en lugar de
 * escribir en PostgreSQL arma las estructuras que consumen las pantallas del
 * panel. Alimenta el panel público /demo, que funciona aunque el despliegue
 * todavía no tenga una base configurada.
 */

const DAY = 86400000;
const AR_TZ = "America/Argentina/Buenos_Aires";
const uid = () => crypto.randomUUID();

function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES: [string, "F" | "M"][] = [
  ["Sofía", "F"], ["Valentina", "F"], ["Camila", "F"], ["Martina", "F"], ["Lucía", "F"],
  ["Julieta", "F"], ["Agustina", "F"], ["Micaela", "F"], ["Florencia", "F"], ["Carolina", "F"],
  ["Paula", "F"], ["Rocío", "F"], ["Milagros", "F"], ["Josefina", "F"], ["Catalina", "F"],
  ["Ana", "F"], ["Laura", "F"], ["Mariana", "F"], ["Victoria", "F"], ["Celeste", "F"],
  ["Juan", "M"], ["Mateo", "M"], ["Santiago", "M"], ["Tomás", "M"], ["Joaquín", "M"],
  ["Facundo", "M"], ["Nicolás", "M"], ["Franco", "M"], ["Bruno", "M"], ["Ramiro", "M"],
  ["Lucas", "M"], ["Federico", "M"], ["Gonzalo", "M"], ["Martín", "M"], ["Iván", "M"],
  ["Diego", "M"], ["Pablo", "M"], ["Andrés", "M"], ["Sebastián", "M"], ["Ezequiel", "M"],
];
const LAST_NAMES = [
  "González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Gómez", "Sánchez",
  "Díaz", "Romero", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Acosta", "Benítez",
  "Medina", "Herrera", "Aguirre", "Pereyra", "Gutiérrez", "Molina", "Silva", "Castro",
  "Rojas", "Ortiz", "Núñez", "Luna", "Juárez", "Cabrera", "Ríos", "Morales", "Godoy", "Vega",
];
const PRODUCTS = [
  { name: "Flat white", price: 3800, w: 10 },
  { name: "Cappuccino", price: 3600, w: 9 },
  { name: "Latte", price: 3700, w: 7 },
  { name: "Espresso", price: 2800, w: 5 },
  { name: "Cold brew", price: 4200, w: 4 },
  { name: "Té chai", price: 3900, w: 3 },
  { name: "Medialunas", price: 2400, w: 8 },
  { name: "Tostado de jamón y queso", price: 6500, w: 6 },
  { name: "Avo toast", price: 7200, w: 5 },
  { name: "Budín de banana", price: 3200, w: 4 },
  { name: "Cheesecake", price: 4800, w: 3 },
  { name: "Yogur con granola", price: 4500, w: 2 },
];
const SOURCES = ["Pasaba por el local", "Instagram", "Me lo recomendaron", "Google Maps", "Otro"];
const SOURCE_W = [30, 34, 20, 12, 4];

function pickWeighted<T>(rand: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}
function pickHour(rand: () => number): number {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const weights = [4, 9, 11, 10, 7, 4, 3, 4, 7, 9, 8, 5, 2];
  return pickWeighted(rand, hours, weights);
}
function localWeekday(date: Date): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: AR_TZ, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}
function localHour(date: Date): number {
  return (
    Number(new Intl.DateTimeFormat("en-US", { timeZone: AR_TZ, hour: "numeric", hour12: false }).format(date)) % 24
  );
}
function atHour(dayMs: number, hour: number, rand: () => number): Date {
  const d = new Date(dayMs);
  d.setUTCHours(hour + 3, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
  return d;
}
function normalizeForEmail(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function monthKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: AR_TZ, year: "numeric", month: "2-digit" }).formatToParts(
    new Date(iso),
  );
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  return `${y}-${m}`;
}
function monthKeyNow(offset = 0): string {
  const key = monthKey(new Date().toISOString());
  if (offset === 0) return key;
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + offset, 15));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function splitProducts(product: string | null): string[] {
  if (!product) return [];
  return product
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s[0]?.toUpperCase() ?? "") + s.slice(1));
}

interface RawCustomer {
  id: string;
  name: string;
  gender: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  first_visit_at: string;
  last_visit_at: string;
  visits: number;
  seniorityDays: number;
  favIdx: number;
  source: string;
  npsBase: number;
}
interface RawSubmission {
  id: string;
  customer_id: string;
  form_id: string;
  product: string;
  amount: number;
  discount_code: string;
  hour: number;
  weekday: number;
  created_at: string;
  answers: { question_id: string; value: unknown }[];
}

interface DemoDataset {
  business: Business;
  userName: string;
  forms: Form[];
  questions: Question[];
  tags: Tag[];
  customers: RawCustomer[];
  submissions: RawSubmission[];
  scans: string[];
  customerTags: Map<string, string[]>;
  segments: { id: string; name: string; description: string; rules: SegmentRule[]; created_at: string; updated_at: string }[];
  campaigns: Campaign[];
  formId: string;
}

let cached: DemoDataset | null = null;
let cachedAt = 0;

function dataset(): DemoDataset {
  if (cached && Date.now() - cachedAt < 6 * 3600_000) return cached;
  cached = build();
  cachedAt = Date.now();
  return cached;
}

function build(): DemoDataset {
  const rand = rng(20260728);
  const now = Date.now();

  const bizId = uid();
  const formId = uid();
  const form2Id = uid();
  const formCreated = new Date(now - 235 * DAY).toISOString();

  const business: Business = {
    id: bizId,
    name: "Café Martina",
    slug: "cafe-martina",
    category: "Cafetería de especialidad",
    address: "Armenia 1602, Palermo, CABA",
    phone: "+54 11 5555 0199",
    logo_url: null,
    brand_color: "#c73418",
    hours: "Lun a Vie 8:00–20:00 · Sáb y Dom 9:00–21:00",
    plan: "pro",
    created_at: new Date(now - 240 * DAY).toISOString(),
  };

  const q: Record<string, string> = {};
  const questionDefs: [string, Partial<Question> & { type: Question["type"]; label: string }][] = [
    ["name", { type: "text", label: "¿Cómo te llamás?", placeholder: "Tu nombre", required: true, maps_to: "name" }],
    ["product", { type: "multiselect", label: "¿Qué pediste hoy?", options: PRODUCTS.map((p) => p.name), required: true, maps_to: "product" }],
    ["phone", { type: "text", label: "Tu teléfono", placeholder: "Ej.: 11 5555 0000", maps_to: "phone" }],
    ["email", { type: "text", label: "Tu email", placeholder: "nombre@email.com", maps_to: "email" }],
    ["source", { type: "select", label: "¿Cómo nos conociste?", options: SOURCES }],
    ["nps", { type: "scale", label: "¿Qué tan probable es que nos recomiendes?", scale_max: 10 }],
    ["gender", { type: "select", label: "Género", options: ["Femenino", "Masculino", "Prefiero no decirlo"], maps_to: "gender" }],
    ["age", { type: "number", label: "¿Cuántos años tenés?", placeholder: "Ej.: 28", maps_to: "age" }],
    ["amount", { type: "number", label: "¿Cuánto gastaste hoy aprox.?", placeholder: "En pesos", maps_to: "amount" }],
  ];
  const questions: Question[] = questionDefs.map(([key, def], i) => {
    const id = uid();
    q[key] = id;
    return {
      id,
      form_id: formId,
      type: def.type,
      label: def.label,
      placeholder: def.placeholder ?? null,
      options: def.options ?? [],
      required: !!def.required,
      active: true,
      position: i,
      maps_to: def.maps_to ?? null,
      scale_max: def.scale_max ?? null,
    };
  });
  const form2Defs: [Question["type"], string, string[] | undefined, number | undefined][] = [
    ["text", "¿Cómo te llamás?", undefined, undefined],
    ["select", "¿Qué día venís más seguido?", ["Sábado", "Domingo", "Ambos", "Casi nunca"], undefined],
    ["multiselect", "¿Qué te gustaría ver en la carta?", ["Pancakes", "Huevos benedictinos", "Croissant relleno", "Jugos prensados", "Opción vegana"], undefined],
    ["scale", "¿Cómo calificás nuestro brunch actual?", undefined, 5],
  ];
  form2Defs.forEach(([type, label, options, scale_max], i) => {
    questions.push({
      id: uid(),
      form_id: form2Id,
      type,
      label,
      placeholder: null,
      options: options ?? [],
      required: i === 0,
      active: true,
      position: i,
      maps_to: i === 0 ? "name" : null,
      scale_max: scale_max ?? null,
    });
  });

  const forms: Form[] = [
    {
      id: formId,
      business_id: bizId,
      name: "Formulario principal",
      slug: "cafe-martina",
      status: "active",
      incentive: "10% de descuento en tu próxima visita",
      welcome_title: "¡Hola! Somos Café Martina ☕",
      welcome_text: "Contanos quién sos y llevate un beneficio para tu próxima visita. Te toma 30 segundos.",
      success_title: "¡Gracias por contarnos!",
      success_text: "Mostrá este código en la caja para usar tu descuento la próxima vez que vengas.",
      theme: { color: "#c73418", showLogo: true, emoji: "☕" },
      is_template: false,
      created_at: formCreated,
      updated_at: formCreated,
    },
    {
      id: form2Id,
      business_id: bizId,
      name: "Encuesta brunch de fin de semana",
      slug: "martina-brunch",
      status: "paused",
      incentive: "Una medialuna de regalo",
      welcome_title: "¿Un minuto para el brunch? 🥐",
      welcome_text: "Queremos armar la mejor carta de brunch de Palermo. Ayudanos con tu opinión.",
      success_title: "",
      success_text: "",
      theme: { color: "#b45309", showLogo: true, emoji: "🥐" },
      is_template: false,
      created_at: new Date(now - 90 * DAY).toISOString(),
      updated_at: new Date(now - 90 * DAY).toISOString(),
    },
  ];

  const tags: Tag[] = [
    { id: uid(), name: "VIP", color: "amber" },
    { id: uid(), name: "Frecuente", color: "violet" },
    { id: uid(), name: "Nuevo", color: "sky" },
    { id: uid(), name: "Vegetariano", color: "green" },
  ];
  const tagId = (name: string) => tags.find((t) => t.name === name)!.id;

  // Días transcurridos del mes en curso: se usa para que una porción de los
  // clientes se haya registrado este mes. Si no, al principio del mes la demo
  // compararía un mes incompleto contra uno completo y mostraría una caída.
  const dayOfMonth = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: AR_TZ, day: "numeric" }).format(new Date()),
  );
  const currentMonthDays = Math.max(3, dayOfMonth);

  const usedNames = new Set<string>();
  const customers: RawCustomer[] = [];
  for (let i = 0; i < 185; i++) {
    let first: string, gender: "F" | "M", last: string, full: string;
    do {
      [first, gender] = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]!;
      last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]!;
      full = `${first} ${last}`;
    } while (usedNames.has(full));
    usedNames.add(full);

    // ~28% se sumaron en el mes en curso; el resto en los 8 meses previos.
    const seniorityDays =
      rand() < 0.28
        ? Math.floor(rand() * currentMonthDays)
        : Math.floor(Math.pow(rand(), 1.4) * 225) + currentMonthDays + 1;

    const r = rand();
    let visits: number;
    if (r < 0.42) visits = 1;
    else if (r < 0.68) visits = 2 + Math.floor(rand() * 2);
    else if (r < 0.88) visits = 4 + Math.floor(rand() * 4);
    else if (r < 0.97) visits = 8 + Math.floor(rand() * 8);
    else visits = 16 + Math.floor(rand() * 12);
    visits = Math.min(visits, Math.max(1, Math.floor(seniorityDays / 6) + 1));

    const saysAge = rand() < 0.66;
    customers.push({
      id: uid(),
      name: full,
      gender: rand() < 0.78 ? (gender === "F" ? "Femenino" : "Masculino") : null,
      age: saysAge ? 18 + Math.floor(Math.pow(rand(), 1.15) * 42) : null,
      phone: rand() < 0.62 ? `115${String(Math.floor(1000000 + rand() * 8999999))}` : null,
      email: rand() < 0.55 ? `${normalizeForEmail(first)}.${normalizeForEmail(last)}${Math.floor(rand() * 90) + 10}@gmail.com` : null,
      notes: null,
      first_visit_at: "",
      last_visit_at: "",
      visits,
      seniorityDays,
      favIdx: pickWeighted(rand, PRODUCTS.map((_, idx) => idx), PRODUCTS.map((p) => p.w)),
      source: pickWeighted(rand, SOURCES, SOURCE_W),
      npsBase: 6 + Math.floor(rand() * 5),
    });
  }

  const submissions: RawSubmission[] = [];
  const scans: string[] = [];
  for (const c of customers) {
    const firstDay = now - c.seniorityDays * DAY;
    const visitDays: number[] = [];
    for (let v = 0; v < c.visits; v++) {
      const t = c.visits === 1 ? 0 : v / (c.visits - 1);
      const jitter = (rand() - 0.5) * 0.18;
      const pos = Math.min(1, Math.max(0, Math.pow(t, 0.85) + jitter));
      visitDays.push(firstDay + pos * (now - firstDay) * 0.985);
    }
    visitDays.sort((a, b) => a - b);
    const visitDates = visitDays.map((dayMs) => {
      const hour = pickHour(rand);
      return { hour, date: atHour(dayMs, hour, rand) };
    });
    c.first_visit_at = visitDates[0]!.date.toISOString();
    c.last_visit_at = visitDates[visitDates.length - 1]!.date.toISOString();

    visitDates.forEach(({ date }, idx) => {
      const iso = date.toISOString();
      const items: (typeof PRODUCTS)[number][] = [];
      const fav = PRODUCTS[c.favIdx]!;
      if (rand() < 0.72) items.push(fav);
      else items.push(PRODUCTS[pickWeighted(rand, PRODUCTS.map((_, i2) => i2), PRODUCTS.map((p) => p.w))]!);
      if (rand() < 0.45) {
        const second = PRODUCTS[pickWeighted(rand, PRODUCTS.map((_, i2) => i2), PRODUCTS.map((p) => p.w))]!;
        if (!items.includes(second)) items.push(second);
      }
      const productStr = items.map((p) => p.name).join(", ");
      const amount = Math.round(items.reduce((a, p) => a + p.price, 0) * (0.92 + rand() * 0.25));
      const code = `MAR-${Math.floor(rand() * 1296).toString(36).padStart(2, "0").toUpperCase()}${Math.floor(rand() * 1296).toString(36).padStart(2, "0").toUpperCase()}`;

      const answers: { question_id: string; value: unknown }[] = [
        { question_id: q.name!, value: c.name.split(" ")[0] },
        { question_id: q.product!, value: items.map((p) => p.name) },
      ];
      if (c.phone) answers.push({ question_id: q.phone!, value: c.phone });
      if (c.email && rand() < 0.8) answers.push({ question_id: q.email!, value: c.email });
      if (idx === 0) answers.push({ question_id: q.source!, value: c.source });
      if (rand() < 0.75) answers.push({ question_id: q.nps!, value: Math.max(1, Math.min(10, c.npsBase + Math.floor(rand() * 3) - 1)) });
      if (c.gender) answers.push({ question_id: q.gender!, value: c.gender });
      if (c.age != null) answers.push({ question_id: q.age!, value: c.age });
      answers.push({ question_id: q.amount!, value: amount });

      submissions.push({
        id: uid(),
        customer_id: c.id,
        form_id: formId,
        product: productStr,
        amount,
        discount_code: code,
        hour: localHour(date),
        weekday: localWeekday(date),
        created_at: iso,
        answers,
      });
      scans.push(iso);
      if (rand() < 0.75) scans.push(atHour(date.getTime(), pickHour(rand), rand).toISOString());
    });
  }

  const byVisits = [...customers].sort((a, b) => b.visits - a.visits);
  const customerTags = new Map<string, string[]>();
  const addTag = (cid: string, tid: string) => {
    const list = customerTags.get(cid) ?? [];
    if (!list.includes(tid)) list.push(tid);
    customerTags.set(cid, list);
  };
  byVisits.slice(0, 9).forEach((c) => addTag(c.id, tagId("VIP")));
  customers.filter((c) => c.visits >= 6).forEach((c) => addTag(c.id, tagId("Frecuente")));
  customers.filter((c) => c.seniorityDays <= 21).forEach((c) => addTag(c.id, tagId("Nuevo")));
  customers.forEach((c) => { if (rand() < 0.07) addTag(c.id, tagId("Vegetariano")); });

  const notes = [
    "Siempre pide el flat white con leche de almendras. Cliente de la mañana.",
    "Vino al evento de cata de octubre. Muy fan del cold brew.",
    "Trabaja en la oficina de la esquina, viene con el equipo los viernes.",
    "Le gustó la propuesta vegana, preguntar por nuevos productos.",
  ];
  byVisits.slice(0, 4).forEach((c, i) => { c.notes = notes[i]!; });

  const segments = [
    { name: "Clientes frecuentes", description: "Vinieron 5 veces o más", rules: [{ field: "visits", op: "gte", value: 5 }] as SegmentRule[] },
    { name: "Inactivos hace 30+ días", description: "Para campañas de recupero", rules: [{ field: "last_visit_days", op: "gte", value: 30 }] as SegmentRule[] },
    { name: "Fans del flat white", description: "Pidieron flat white alguna vez y dejaron teléfono", rules: [{ field: "product", op: "contains", value: "Flat white" }, { field: "has_phone", op: "eq", value: true }] as SegmentRule[] },
    { name: "Ticket alto", description: "Gastaron más de $40.000 en total", rules: [{ field: "total_spent", op: "gte", value: 40000 }] as SegmentRule[] },
    { name: "Jóvenes 18–30", description: "Edad entre 18 y 30 años", rules: [{ field: "age", op: "between", min: 18, max: 30 }] as SegmentRule[] },
  ].map((s) => ({
    id: uid(),
    ...s,
    created_at: new Date(now - 120 * DAY).toISOString(),
    updated_at: new Date(now - 40 * DAY).toISOString(),
  }));

  const freq = customers.filter((c) => c.visits >= 5 && c.phone);
  const campaigns: Campaign[] = [
    {
      id: uid(), business_id: bizId, name: "Volvió el budín de banana 🍌", channel: "whatsapp",
      segment_id: segments[0]!.id, segment_name: segments[0]!.name, subject: null,
      message: "Hola {{nombre}} 👋 ¡Volvió el budín de banana que tanto pedían! Esta semana, si venís por la tarde, te lo llevás con 2x1. Te esperamos en Armenia 1602.",
      status: "sent", scheduled_for: null, sent_at: new Date(now - 52 * DAY).toISOString(),
      audience_count: freq.length, created_at: new Date(now - 54 * DAY).toISOString(), updated_at: new Date(now - 52 * DAY).toISOString(),
    },
    {
      id: uid(), business_id: bizId, name: "Te extrañamos ❤️", channel: "whatsapp",
      segment_id: segments[1]!.id, segment_name: segments[1]!.name, subject: null,
      message: "Hola {{nombre}}, hace un tiempo que no venís por Café Martina. Esta semana tenés un beneficio especial esperándote: mostrá este mensaje y llevate un 15% en tu {{producto_favorito}}.",
      status: "draft", scheduled_for: null, sent_at: null, audience_count: 0,
      created_at: new Date(now - 9 * DAY).toISOString(), updated_at: new Date(now - 2 * DAY).toISOString(),
    },
    {
      id: uid(), business_id: bizId, name: "Novedades de la carta de invierno", channel: "email",
      segment_id: segments[3]!.id, segment_name: segments[3]!.name, subject: "Llegó la carta de invierno ❄️",
      message: "Hola {{nombre_completo}}: como cliente de la casa queremos que seas de los primeros en probar la nueva carta de invierno. Reservá tu mesa esta semana y el postre va por nuestra cuenta.",
      status: "scheduled", scheduled_for: new Date(now + 5 * DAY).toISOString(), sent_at: null, audience_count: 0,
      created_at: new Date(now - 1 * DAY).toISOString(), updated_at: new Date(now - 1 * DAY).toISOString(),
    },
  ];

  return { business, userName: "Martina López", forms, questions, tags, customers, submissions, scans, customerTags, segments, campaigns, formId };
}

/* ————— Vistas (mismas formas que devuelven los servicios reales) ————— */

export function getDemoBusiness(): Business {
  return dataset().business;
}
export function getDemoUserName(): string {
  return dataset().userName;
}
export function demoForms(): Form[] {
  const d = dataset();
  return d.forms.map((f) => ({
    ...f,
    questions: d.questions.filter((qq) => qq.form_id === f.id),
    submissions_count: f.id === d.formId ? d.submissions.length : 0,
    scans_count: f.id === d.formId ? d.scans.length : 0,
  }));
}
export function demoTags(): Tag[] {
  return dataset().tags;
}
export function demoTotalCustomers(): number {
  return dataset().customers.length;
}

export function demoCustomerFacts(): CustomerFacts[] {
  const d = dataset();
  const tagById = new Map(d.tags.map((t) => [t.id, t]));
  const subsByCustomer = new Map<string, RawSubmission[]>();
  for (const s of d.submissions) {
    const list = subsByCustomer.get(s.customer_id) ?? [];
    list.push(s);
    subsByCustomer.set(s.customer_id, list);
  }
  return d.customers.map((c) => {
    const subs = subsByCustomer.get(c.id) ?? [];
    const productCounts = new Map<string, number>();
    const productsSet = new Set<string>();
    let spent = 0;
    const answers: Record<string, unknown[]> = {};
    for (const s of subs) {
      spent += s.amount;
      if (s.product) {
        productCounts.set(s.product, (productCounts.get(s.product) ?? 0) + 1);
        for (const p of s.product.split(",").map((x) => x.trim()).filter(Boolean)) productsSet.add(p);
      }
      for (const a of s.answers) (answers[a.question_id] ??= []).push(a.value);
    }
    let fav: string | null = null;
    let favCount = 0;
    for (const [p, n] of productCounts) if (n > favCount) { favCount = n; fav = p; }
    const spanDays = (new Date(c.last_visit_at).getTime() - new Date(c.first_visit_at).getTime()) / DAY;
    return {
      id: c.id,
      business_id: d.business.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      gender: c.gender,
      age: c.age,
      notes: c.notes,
      first_visit_at: c.first_visit_at,
      last_visit_at: c.last_visit_at,
      visits: c.visits,
      created_at: c.first_visit_at,
      favorite_product: fav,
      products: [...productsSet],
      total_spent: Math.round(spent),
      submissions_count: subs.length,
      tags: (d.customerTags.get(c.id) ?? []).map((tid) => tagById.get(tid)!).filter(Boolean),
      answers,
      avg_days_between_visits: c.visits > 1 ? Math.round(spanDays / (c.visits - 1)) : null,
    };
  });
}

export function demoCustomer(id: string): CustomerFacts | null {
  return demoCustomerFacts().find((c) => c.id === id) ?? null;
}

export function demoCustomerHistory(id: string): CustomerHistoryEntry[] {
  const d = dataset();
  const qById = new Map(d.questions.map((qq) => [qq.id, qq]));
  return d.submissions
    .filter((s) => s.customer_id === id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((s) => ({
      submission_id: s.id,
      form_name: d.forms.find((f) => f.id === s.form_id)?.name ?? "Formulario",
      product: s.product,
      amount: s.amount,
      discount_code: s.discount_code,
      created_at: s.created_at,
      answers: s.answers.map((a) => {
        const qq = qById.get(a.question_id);
        return { question_id: a.question_id, label: qq?.label ?? "", type: qq?.type ?? "text", value: a.value };
      }),
    }));
}

export function demoSubmissions(): SubmissionRow[] {
  const d = dataset();
  const nameById = new Map(d.customers.map((c) => [c.id, c.name]));
  return d.submissions
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((s) => {
      const answers: Record<string, unknown> = {};
      for (const a of s.answers) answers[a.question_id] = a.value;
      return {
        id: s.id,
        form_id: s.form_id,
        form_name: d.forms.find((f) => f.id === s.form_id)?.name ?? "",
        customer_id: s.customer_id,
        customer_name: nameById.get(s.customer_id) ?? null,
        product: s.product,
        amount: s.amount,
        discount_code: s.discount_code,
        created_at: s.created_at,
        answers,
      };
    });
}

export function demoSegments(): Segment[] {
  const d = dataset();
  const facts = demoCustomerFacts();
  return d.segments.map((s) => ({
    id: s.id,
    business_id: d.business.id,
    name: s.name,
    description: s.description,
    rules: s.rules,
    created_at: s.created_at,
    updated_at: s.updated_at,
    count: s.rules.length === 0 ? facts.length : facts.filter((c) => s.rules.every((r) => matchesRule(c, r))).length,
  }));
}

export function demoSegmentQuestions() {
  const d = dataset();
  return d.questions
    .filter((qq) => !qq.maps_to)
    .map((qq) => ({
      id: qq.id,
      label: qq.label,
      type: qq.type,
      options: qq.options,
      form_name: d.forms.find((f) => f.id === qq.form_id)?.name ?? "",
    }));
}

export function demoCampaigns(): Campaign[] {
  return dataset().campaigns;
}

export function demoDashboardStats(): DashboardStats {
  const d = dataset();
  const thisMonth = monthKeyNow(0);
  const prevMonth = monthKeyNow(-1);

  let newThisMonth = 0, newPrevMonth = 0, recurrent = 0;
  const firstVisitMonth = new Map<string, string>();
  for (const c of d.customers) {
    const mk = monthKey(c.first_visit_at);
    firstVisitMonth.set(c.id, mk);
    if (mk === thisMonth) newThisMonth++;
    if (mk === prevMonth) newPrevMonth++;
    if (c.visits >= 2) recurrent++;
  }

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) months.push(monthKeyNow(-i));
  const monthSet = new Set(months);
  const newByMonth = new Map<string, number>();
  const recurrentByMonth = new Map<string, Set<string>>();
  for (const [, mk] of firstVisitMonth) if (monthSet.has(mk)) newByMonth.set(mk, (newByMonth.get(mk) ?? 0) + 1);

  let submissionsThisMonth = 0;
  const hourCounts = new Array<number>(24).fill(0);
  const productCounts = new Map<string, number>();
  for (const s of d.submissions) {
    const mk = monthKey(s.created_at);
    if (mk === thisMonth) submissionsThisMonth++;
    if (s.hour >= 0 && s.hour < 24) hourCounts[s.hour]!++;
    for (const p of splitProducts(s.product)) productCounts.set(p, (productCounts.get(p) ?? 0) + 1);
    if (monthSet.has(mk) && firstVisitMonth.get(s.customer_id) !== mk) {
      const set = recurrentByMonth.get(mk) ?? new Set<string>();
      set.add(s.customer_id);
      recurrentByMonth.set(mk, set);
    }
  }

  const freq = [
    { bucket: "1 visita", count: 0 },
    { bucket: "2–3", count: 0 },
    { bucket: "4–6", count: 0 },
    { bucket: "7–10", count: 0 },
    { bucket: "Más de 10", count: 0 },
  ];
  for (const c of d.customers) {
    if (c.visits <= 1) freq[0]!.count++;
    else if (c.visits <= 3) freq[1]!.count++;
    else if (c.visits <= 6) freq[2]!.count++;
    else if (c.visits <= 10) freq[3]!.count++;
    else freq[4]!.count++;
  }

  return {
    total_customers: d.customers.length,
    new_this_month: newThisMonth,
    new_prev_month: newPrevMonth,
    recurrent_customers: recurrent,
    return_rate: d.customers.length > 0 ? Math.round((recurrent / d.customers.length) * 100) : 0,
    total_submissions: d.submissions.length,
    submissions_this_month: submissionsThisMonth,
    total_scans: d.scans.length,
    conversion_rate: d.scans.length > 0 ? Math.round((d.submissions.length / d.scans.length) * 100) : 0,
    customers_by_month: months.map((m) => ({ month: m, nuevos: newByMonth.get(m) ?? 0, recurrentes: recurrentByMonth.get(m)?.size ?? 0 })),
    top_products: [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })),
    visits_by_hour: hourCounts.map((count, hour) => ({ hour, count })),
    visit_frequency: freq,
    recent_submissions: demoSubmissions().slice(0, 8),
  };
}

export function demoAnalytics(): AnalyticsData {
  const d = dataset();
  const facts = demoCustomerFacts();
  const now = Date.now();
  const thisMonth = monthKeyNow(0);
  const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  let lost = 0, active30 = 0;
  const gaps: number[] = [], ages: number[] = [];
  const genderCounts = new Map<string, number>();
  for (const c of facts) {
    const days = (now - new Date(c.last_visit_at).getTime()) / DAY;
    if (days > 30) lost++; else active30++;
    if (c.avg_days_between_visits != null) gaps.push(c.avg_days_between_visits);
    if (c.age != null) ages.push(c.age);
    genderCounts.set(c.gender ?? "Sin dato", (genderCounts.get(c.gender ?? "Sin dato") ?? 0) + 1);
  }
  const ageBuckets = [
    { bucket: "18–24", min: 0, max: 24, count: 0 },
    { bucket: "25–34", min: 25, max: 34, count: 0 },
    { bucket: "35–44", min: 35, max: 44, count: 0 },
    { bucket: "45–54", min: 45, max: 54, count: 0 },
    { bucket: "55+", min: 55, max: 200, count: 0 },
  ];
  for (const a of ages) ageBuckets.find((x) => a >= x.min && a <= x.max)!.count++;

  const subsSorted = d.submissions.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const weekdayCounts = new Array<number>(7).fill(0);
  let revenue = 0;
  const lastSeen = new Map<string, number>();
  const recoveredByMonth = new Map<string, number>();
  let recoveredThisMonth = 0;
  for (const s of subsSorted) {
    if (s.weekday >= 0 && s.weekday < 7) weekdayCounts[s.weekday]!++;
    revenue += s.amount;
    const t = new Date(s.created_at).getTime();
    const prev = lastSeen.get(s.customer_id);
    if (prev !== undefined && t - prev > 30 * DAY) {
      const mk = monthKey(s.created_at);
      recoveredByMonth.set(mk, (recoveredByMonth.get(mk) ?? 0) + 1);
      if (mk === thisMonth) recoveredThisMonth++;
    }
    lastSeen.set(s.customer_id, t);
  }

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) months.push(monthKeyNow(-i));
  const newByMonth = new Map<string, number>();
  const lostByMonth = new Map<string, number>();
  for (const c of facts) {
    const fm = monthKey(c.first_visit_at);
    if (months.includes(fm)) newByMonth.set(fm, (newByMonth.get(fm) ?? 0) + 1);
    const days = (now - new Date(c.last_visit_at).getTime()) / DAY;
    if (days > 30) {
      const lm = monthKey(c.last_visit_at);
      if (months.includes(lm)) lostByMonth.set(lm, (lostByMonth.get(lm) ?? 0) + 1);
    }
  }

  const productCounts = new Map<string, number>();
  for (const s of d.submissions) for (const p of splitProducts(s.product)) productCounts.set(p, (productCounts.get(p) ?? 0) + 1);

  const answersByQ = new Map<string, unknown[]>();
  for (const s of d.submissions) {
    for (const a of s.answers) {
      const list = answersByQ.get(a.question_id) ?? [];
      list.push(a.value);
      answersByQ.set(a.question_id, list);
    }
  }
  const qList = d.questions.filter((qq) => !["name", "phone", "email"].includes(qq.maps_to ?? ""));

  const breakdowns = qList
    .map((qq) => {
      const values = answersByQ.get(qq.id) ?? [];
      if (values.length === 0) return null;
      const bd: AnalyticsData["question_breakdowns"][number] = {
        question_id: qq.id,
        form_name: d.forms.find((f) => f.id === qq.form_id)?.name ?? "",
        label: qq.label,
        type: qq.type,
        responses: values.length,
      };
      if (["select", "multiselect", "boolean"].includes(qq.type)) {
        const counts = new Map<string, number>();
        for (const v of values) for (const item of Array.isArray(v) ? v : [v]) {
          if (item == null) continue;
          const key = typeof item === "boolean" ? (item ? "Sí" : "No") : String(item);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        bd.options = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
      } else if (["scale", "number"].includes(qq.type)) {
        const nums = values.map(Number).filter((n) => Number.isFinite(n));
        if (nums.length) bd.average = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
        if (qq.type === "scale") {
          const max = qq.scale_max ?? 10;
          const counts = new Map<number, number>();
          for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
          bd.options = Array.from({ length: max }, (_, i) => ({ label: String(i + 1), count: counts.get(i + 1) ?? 0 }));
        }
      } else {
        bd.samples = values.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(-6).reverse();
      }
      return bd;
    })
    .filter((b): b is AnalyticsData["question_breakdowns"][number] => b !== null);

  return {
    active_30d: active30,
    lost_customers: lost,
    recovered_this_month: recoveredThisMonth,
    avg_days_between_visits: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
    avg_age: ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null,
    total_revenue_tracked: Math.round(revenue),
    gender_distribution: [...genderCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })),
    age_histogram: ageBuckets.map(({ bucket, count }) => ({ bucket, count })),
    weekday_distribution: WEEKDAYS.map((day, i) => ({ day, count: weekdayCounts[i] ?? 0 })),
    monthly_movement: months.map((m) => ({ month: m, nuevos: newByMonth.get(m) ?? 0, recuperados: recoveredByMonth.get(m) ?? 0, perdidos: lostByMonth.get(m) ?? 0 })),
    top_customers: facts.slice().sort((a, b) => b.visits - a.visits).slice(0, 10).map((c) => ({ id: c.id, name: c.name, visits: c.visits, favorite: c.favorite_product, last_visit: c.last_visit_at, spent: c.total_spent })),
    top_products: [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
    question_ranking: qList.map((qq) => ({ label: qq.label, responses: (answersByQ.get(qq.id) ?? []).length, form_name: d.forms.find((f) => f.id === qq.form_id)?.name ?? "" })).sort((a, b) => b.responses - a.responses).slice(0, 10),
    question_breakdowns: breakdowns,
  };
}
