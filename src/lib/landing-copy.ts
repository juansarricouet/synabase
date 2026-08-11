/**
 * Textos y precios de la landing, en los dos idiomas.
 *
 * La página se sirve como dos rutas estáticas (`/` y `/en`) que comparten el
 * mismo componente: no hay estado de idioma en el cliente, así que cada versión
 * se pre-renderiza entera y Google puede indexar las dos.
 */

import { PLANS, USD_RATE } from "@/lib/plans";

const WA = PLANS.business.whatsappIncluded.toLocaleString("es-AR");

export type Lang = "es" | "en";

/** Redondea a la decena de dólares más cercana, para no publicar "USD 37,50". */
function toUsd(ars: number): number {
  return Math.round(ars / USD_RATE / 5) * 5;
}

export interface Plan {
  name: string;
  /** Precio mensual en pesos. Es la fuente de verdad; el dólar sale de acá. */
  ars: number;
  features: string[];
  cta: string;
  highlight?: boolean;
}

/** Cómo se escribe el precio de un plan en cada idioma. */
export function planPrice(plan: Plan, lang: Lang): { price: string; period: string } {
  if (plan.ars === 0) {
    return {
      price: lang === "es" ? "$0" : "$0",
      period: lang === "es" ? "para siempre" : "forever",
    };
  }
  if (lang === "es") {
    return { price: `$${plan.ars.toLocaleString("es-AR")}`, period: "por mes" };
  }
  return { price: `US$${toUsd(plan.ars)}`, period: "per month" };
}

interface Copy {
  htmlLang: string;
  meta: { title: string; description: string };
  /** Etiqueta del botón que lleva al otro idioma. */
  switchTo: string;
  switchHref: string;
  nav: { howItWorks: string; process: string; pricing: string; faq: string };
  login: string;
  seeDemo: string;
  createAccount: string;
  hero: {
    eyebrow: string;
    /** Cada elemento es una línea del titular: se anima una por una. */
    titleLines: string[];
    subtitle: string;
    note: string;
  };
  marquee: string[];
  thesis: { titleLines: string[]; body: string };
  /**
   * El argumento del delivery.
   *
   * Va aparte de `features` porque no es una función más: es el motivo por el
   * que le sirve a un comercio que ya vende por apps de pedidos. No se nombra
   * a ninguna plataforma.
   */
  delivery: {
    titleLines: string[];
    body: string;
    points: { title: string; text: string }[];
  };
  features: { n: string; eyebrow: string; title: string; items: string[] }[];
  process: { heading: string; steps: { n: string; title: string; text: string }[] };
  dark: {
    eyebrow: string;
    title: string;
    body: string;
    cards: { title: string; text: string }[];
  };
  pricing: { heading: string; plans: Plan[] };
  faq: { eyebrow: string; title: string; note: string; items: { q: string; a: string }[] };
  /** Pregunta cuya respuesta lleva un enlace a la demo, insertado en `{demo}`. */
  faqDemoLabel: string;
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    whatsapp: string;
    email: string;
  };
  closing: { titleLines: string[] };
  footer: { tagline: string; demo: string; login: string; register: string };
}

const PLANS_ES: Plan[] = [
  {
    name: PLANS.free.name,
    ars: PLANS.free.ars,
    features: [
      "1 formulario con QR",
      "Hasta 100 clientes en tu base",
      "Panel, estadísticas y respuestas",
      "Sin campañas: ni email ni WhatsApp",
    ],
    cta: "Crear cuenta",
  },
  {
    name: PLANS.pro.name,
    ars: PLANS.pro.ars,
    features: [
      "Formularios y clientes ilimitados",
      "Segmentos y campañas por email",
      "Estadísticas avanzadas y exportación",
      "QR personalizado con tu marca",
    ],
    cta: "Probar Pro",
    highlight: true,
  },
  {
    name: PLANS.business.name,
    ars: PLANS.business.ars,
    features: [
      "Todo lo de Pro",
      `Campañas por WhatsApp: ${WA} mensajes por mes`,
      "Múltiples sucursales",
      "Roles, permisos y soporte prioritario",
    ],
    cta: "Hablar con ventas",
  },
];

const PLANS_EN: Plan[] = [
  {
    name: PLANS.free.name,
    ars: PLANS.free.ars,
    features: [
      "1 form with QR code",
      "Up to 100 customers in your database",
      "Dashboard, analytics and responses",
      "No campaigns: neither email nor WhatsApp",
    ],
    cta: "Create account",
  },
  {
    name: PLANS.pro.name,
    ars: PLANS.pro.ars,
    features: [
      "Unlimited forms and customers",
      "Segments and email campaigns",
      "Advanced analytics and exports",
      "QR code with your own branding",
    ],
    cta: "Try Pro",
    highlight: true,
  },
  {
    name: PLANS.business.name,
    ars: PLANS.business.ars,
    features: [
      "Everything in Pro",
      `WhatsApp campaigns: ${WA} messages per month`,
      "Multiple locations",
      "Roles, permissions and priority support",
    ],
    cta: "Talk to sales",
  },
];

const ES: Copy = {
  htmlLang: "es",
  meta: {
    title: "SynapBase — La base de datos de tus clientes se arma sola",
    description:
      "Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume y cuándo vuelve. Un producto de Synapse.",
  },
  switchTo: "EN",
  switchHref: "/en",
  nav: { howItWorks: "Cómo funciona", process: "Proceso", pricing: "Precios", faq: "Preguntas" },
  login: "Iniciar sesión",
  seeDemo: "Ver la demo",
  createAccount: "Crear mi cuenta",
  hero: {
    eyebrow: "Un producto de synapse.",
    titleLines: ["La base de datos", "de tus clientes", "se arma sola"],
    subtitle:
      "Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume y cuándo vuelve. Sin planillas. Sin adivinar.",
    note: "Sin tarjeta · Tu QR listo en dos minutos",
  },
  marquee: [
    "Nombre y contacto",
    "Qué consume",
    "Cada cuánto vuelve",
    "Cuánto gasta",
    "A qué hora viene",
    "Cómo te conoció",
    "Qué edad tiene",
    "Hace cuánto no aparece",
  ],
  thesis: {
    titleLines: ["El descuento es el gancho.", "La información es el negocio."],
    body: "Cientos de personas pasan por tu local todos los meses y no sabés nada de ellas. Quién volvió, quién no vino más, qué pide cada uno. SynapBase convierte ese anonimato en datos que podés usar.",
  },
  delivery: {
    titleLines: ["Los pedidos son tuyos.", "Los clientes, todavía no."],
    body: "Cada pedido que entra por una app lo cocinaste vos, lo pagó alguien que quiso comer lo tuyo, y el nombre de esa persona queda del otro lado. Pagás la comisión y encima seguís sin saber quién te compró. Un QR en la bolsa lo cambia.",
    points: [
      {
        title: "Un QR aparte, adentro del pedido",
        text: "Impreso en el ticket o pegado en la bolsa, con su propio descuento para la próxima visita al local.",
      },
      {
        title: "Sabés cuáles se ganaron ahí",
        text: "Cada cliente queda marcado según por dónde entró, así ves cuántos venían de una app y cuánto gastan comparados con los del local.",
      },
      {
        title: "La próxima te compra directo",
        text: "Ya tenés cómo escribirles. El pedido siguiente puede entrar sin intermediario y sin comisión.",
      },
    ],
  },
  features: [
    {
      n: "01",
      eyebrow: "Captura",
      title: "Cada visita, un cliente con nombre",
      items: [
        "Un QR con tu marca, listo para imprimir en PNG, SVG o PDF",
        "El cliente responde en treinta segundos desde su celular",
        "Vos definís las preguntas: consumo, contacto, lo que necesites",
      ],
    },
    {
      n: "02",
      eyebrow: "Datos",
      title: "Sabés qué consume y cuándo vuelve",
      items: [
        "Visitas, frecuencia, producto favorito y gasto total, automáticos",
        "Segmentos por comportamiento real, no por corazonada",
        "Todo exportable a Excel, CSV o PDF cuando lo necesites",
      ],
    },
    {
      n: "03",
      eyebrow: "Retorno",
      title: "Mensajes que traen gente de vuelta",
      items: [
        "Email y WhatsApp con el nombre y el gusto de cada cliente",
        "Audiencia calculada al instante antes de enviar",
        "Borradores, programación e historial de cada campaña",
      ],
    },
  ],
  process: {
    heading: "Cómo empezás",
    steps: [
      { n: "01", title: "Creás tu cuenta", text: "Cargás el nombre de tu comercio y ya tenés tu panel con un formulario listo." },
      { n: "02", title: "Personalizás las preguntas", text: "Definís qué querés saber de tus clientes y con qué beneficio los invitás." },
      { n: "03", title: "Imprimís el QR", text: "Lo ponés en mesas, mostrador o vidriera. Desde ahí empieza a llenarse la base." },
      { n: "04", title: "Hacés que vuelvan", text: "Segmentás por comportamiento y mandás campañas que se sienten personales." },
    ],
  },
  dark: {
    eyebrow: "04 — Fidelización",
    title: "No es otro CRM. Es entender a tu gente.",
    body: "Un comercio no paga por un generador de formularios. Paga porque le respondés quiénes son sus mejores clientes, por qué dejan de venir y a quién escribirle esta semana.",
    cards: [
      { title: "Quiénes son tus mejores clientes", text: "Ranking por visitas y por gasto real" },
      { title: "Por qué dejan de venir", text: "Clientes perdidos y recuperados, mes a mes" },
      { title: "A quién le escribís esta semana", text: "Segmentos listos para convertir en campaña" },
    ],
  },
  pricing: { heading: "Empezá gratis. Crecé cuando lo veas funcionar.", plans: PLANS_ES },
  faq: {
    eyebrow: "Preguntas",
    title: "Lo que todos preguntan antes de empezar",
    note: "Si lo tuyo no está acá, escribinos por WhatsApp y te contestamos nosotros.",
    items: [
      {
        q: "¿Mis clientes tienen que bajarse una app?",
        a: "No. Escanean el QR con la cámara del celular, se abre una página web, responden y listo. No hay nada que instalar, ni de tu lado ni del de ellos.",
      },
      {
        q: "¿Cuánto tarda una persona en completar el formulario?",
        a: "Alrededor de treinta segundos. Vos elegís cuántas preguntas hacer: cuantas menos, más gente lo termina. Con el nombre y qué consumió ya tenés una ficha útil.",
      },
      {
        q: "¿Y si no quiero dar descuento?",
        a: "El descuento es el gancho más común, pero podés usar lo que quieras: un café de regalo, un sorteo mensual, puntos. Lo que importa es que haya un motivo para escanear.",
      },
      {
        q: "¿De quién son los datos que se cargan?",
        a: "Tuyos. Cada comercio ve solamente su propia base, y podés exportarla entera a CSV, Excel o PDF cuando quieras. Si te vas, te llevás tu información.",
      },
      {
        q: "¿Sirve si tengo más de un local?",
        a: "Sí. Podés generar un QR distinto por sucursal y ver los datos juntos o separados. El plan Business incluye múltiples sucursales y usuarios con permisos.",
      },
      {
        q: "¿Necesito saber de tecnología para usarlo?",
        a: "No. Creás la cuenta, elegís las preguntas, descargás el QR y lo imprimís. El panel está pensado para que lo use quien atiende, no un equipo de sistemas.",
      },
    ],
  },
  faqDemoLabel: "demo con datos de ejemplo",
  contact: {
    eyebrow: "Contacto",
    title: "¿Te quedó alguna duda? Escribinos.",
    body: "Contestamos nosotros, no un bot. Contanos qué tipo de local tenés y te decimos si SynapBase te sirve — aunque la respuesta sea que no.",
    whatsapp: "Escribinos por WhatsApp",
    email: "Mandanos un mail",
  },
  closing: { titleLines: ["Tus clientes ya entran por la puerta.", "Empezá a conocerlos."] },
  footer: {
    tagline: "Synapse · La base de datos inteligente para comercios",
    demo: "Demo",
    login: "Iniciar sesión",
    register: "Crear cuenta",
  },
};

const EN: Copy = {
  htmlLang: "en",
  meta: {
    title: "SynapBase — Your customer database builds itself",
    description:
      "A QR code in your venue turns every visit into a customer you know: who they are, what they order and when they come back. A Synapse product.",
  },
  switchTo: "ES",
  switchHref: "/",
  nav: { howItWorks: "How it works", process: "Process", pricing: "Pricing", faq: "FAQ" },
  login: "Log in",
  seeDemo: "See the demo",
  createAccount: "Create account",
  hero: {
    eyebrow: "A synapse product.",
    titleLines: ["Your customer", "database builds", "itself"],
    subtitle:
      "A QR code in your venue turns every visit into a customer you know: who they are, what they order and when they come back. No spreadsheets. No guessing.",
    note: "No card required · Your QR ready in two minutes",
  },
  marquee: [
    "Name and contact",
    "What they order",
    "How often they return",
    "How much they spend",
    "What time they come",
    "How they found you",
    "How old they are",
    "How long since their last visit",
  ],
  thesis: {
    titleLines: ["The discount is the hook.", "The data is the business."],
    body: "Hundreds of people walk through your door every month and you know nothing about them. Who came back, who never returned, what each one orders. SynapBase turns that anonymity into data you can act on.",
  },
  delivery: {
    titleLines: ["The orders are yours.", "The customers aren't."],
    body: "Every order that comes through a delivery app was cooked by you, paid for by someone who wanted your food, and their name stays on the other side. You pay the commission and still don't know who bought from you. A QR code in the bag changes that.",
    points: [
      {
        title: "A separate QR, inside the order",
        text: "Printed on the receipt or stuck to the bag, with its own discount for their next visit to your place.",
      },
      {
        title: "You know which ones you won there",
        text: "Every customer is tagged by where they came from, so you can see how many came from an app and how much they spend next to your walk-ins.",
      },
      {
        title: "Next time they order direct",
        text: "You already have a way to reach them. The next order can come in with no middleman and no commission.",
      },
    ],
  },
  features: [
    {
      n: "01",
      eyebrow: "Capture",
      title: "Every visit, a customer with a name",
      items: [
        "A QR code with your branding, ready to print as PNG, SVG or PDF",
        "Customers answer in thirty seconds from their phone",
        "You choose the questions: orders, contact, whatever you need",
      ],
    },
    {
      n: "02",
      eyebrow: "Data",
      title: "You know what they order and when they return",
      items: [
        "Visits, frequency, favourite product and total spend, all automatic",
        "Segments built on real behaviour, not hunches",
        "Export everything to Excel, CSV or PDF whenever you need it",
      ],
    },
    {
      n: "03",
      eyebrow: "Return",
      title: "Messages that bring people back",
      items: [
        "Email and WhatsApp using each customer's name and taste",
        "Audience size calculated instantly before you send",
        "Drafts, scheduling and a history of every campaign",
      ],
    },
  ],
  process: {
    heading: "How you get started",
    steps: [
      { n: "01", title: "Create your account", text: "Enter your venue's name and your dashboard arrives with a form ready to go." },
      { n: "02", title: "Customise the questions", text: "Decide what you want to know about your customers and what perk you offer them." },
      { n: "03", title: "Print the QR code", text: "Put it on tables, the counter or the window. That's where the database starts filling up." },
      { n: "04", title: "Bring them back", text: "Segment by behaviour and send campaigns that actually feel personal." },
    ],
  },
  dark: {
    eyebrow: "04 — Loyalty",
    title: "Not another CRM. It's understanding your people.",
    body: "A venue doesn't pay for a form builder. It pays because you answer who its best customers are, why they stop coming and who to message this week.",
    cards: [
      { title: "Who your best customers are", text: "Ranked by visits and by actual spend" },
      { title: "Why they stop coming", text: "Lost and recovered customers, month by month" },
      { title: "Who to message this week", text: "Segments ready to turn into a campaign" },
    ],
  },
  pricing: { heading: "Start free. Grow once you see it working.", plans: PLANS_EN },
  faq: {
    eyebrow: "FAQ",
    title: "What everyone asks before starting",
    note: "If your question isn't here, message us on WhatsApp and we'll answer it ourselves.",
    items: [
      {
        q: "Do my customers need to download an app?",
        a: "No. They scan the QR code with their phone camera, a web page opens, they answer and that's it. Nothing to install, on your side or theirs.",
      },
      {
        q: "How long does the form take to fill in?",
        a: "Around thirty seconds. You decide how many questions to ask: the fewer you ask, the more people finish. A name and what they ordered is already a useful record.",
      },
      {
        q: "What if I don't want to give a discount?",
        a: "A discount is the most common hook, but you can use anything: a free coffee, a monthly raffle, points. What matters is that there's a reason to scan.",
      },
      {
        q: "Who owns the data that gets collected?",
        a: "You do. Each venue sees only its own database, and you can export all of it to CSV, Excel or PDF whenever you want. If you leave, you take your data with you.",
      },
      {
        q: "Does it work if I have more than one location?",
        a: "Yes. You can generate a different QR code per location and view the data together or separately. The Business plan includes multiple locations and users with permissions.",
      },
      {
        q: "Do I need to be technical to use it?",
        a: "No. You create the account, pick the questions, download the QR code and print it. The dashboard is built for whoever works the floor, not for an IT team.",
      },
    ],
  },
  faqDemoLabel: "demo with sample data",
  contact: {
    eyebrow: "Contact",
    title: "Still have questions? Message us.",
    body: "We answer ourselves, not a bot. Tell us what kind of venue you run and we'll tell you whether SynapBase is a fit — even if the answer is no.",
    whatsapp: "Message us on WhatsApp",
    email: "Send us an email",
  },
  closing: { titleLines: ["Your customers already walk in.", "Start getting to know them."] },
  footer: {
    tagline: "Synapse · The smart customer database for local businesses",
    demo: "Demo",
    login: "Log in",
    register: "Sign up",
  },
};

export const COPY: Record<Lang, Copy> = { es: ES, en: EN };

/** La pregunta sobre probar antes de pagar lleva un enlace, así que va aparte. */
export const TRIAL_FAQ: Record<Lang, { q: string; before: string; after: string }> = {
  es: {
    q: "¿Puedo probarlo antes de pagar?",
    before: "Sí, de dos formas: mirando la ",
    after: " sin registrarte, o creando una cuenta Free, que no vence ni pide tarjeta.",
  },
  en: {
    q: "Can I try it before paying?",
    before: "Yes, two ways: browse the ",
    after: " without signing up, or create a Free account — it never expires and asks for no card.",
  },
};
