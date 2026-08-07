import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Mail, MessageCircle } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { CampaignMock, CaptureMock, HeroMock, ProfileMock } from "@/components/landing/Mocks";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/contact";

export const metadata = {
  title: "SynapBase — La base de datos de tus clientes se arma sola",
  description:
    "Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume y cuándo vuelve. Un producto de Synapse.",
};

/** Marca de palabra al estilo Synapse: minúsculas, bold y punto en coral. */
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[19px] font-extrabold tracking-tight text-inkblack ${className}`}>
      synapbase<span className="text-coral">.</span>
    </span>
  );
}

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="font-display text-[13px] font-bold tracking-tight text-coral">
      {n} — {children}
    </p>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 size-4 shrink-0 text-inkblack" strokeWidth={3} />
      <span className="body-copy text-[15px] text-inkblack/75">{children}</span>
    </li>
  );
}

/**
 * Pregunta frecuente. Usa `<details>` nativo: se abre sin JavaScript y sin
 * animaciones, que es justo lo que pide el resto de la página.
 */
function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group border-b border-inkblack/10 py-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-[17px] font-bold tracking-[-0.02em] text-inkblack sm:text-[19px]">{q}</h3>
        <ChevronDown className="mt-0.5 size-5 shrink-0 text-inkblack/35 transition-transform group-open:rotate-180" />
      </summary>
      <div className="body-copy mt-3 max-w-[62ch] pr-10 text-[15px] text-inkblack/65">{a}</div>
    </details>
  );
}

/** Sección numerada: texto de un lado, maqueta del otro, alternando. */
function FeatureSection({
  n,
  eyebrow,
  title,
  items,
  mock,
  flip = false,
}: {
  n: string;
  eyebrow: string;
  title: React.ReactNode;
  items: string[];
  mock: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="border-t border-inkblack/8 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className={`rv ${flip ? "rv-right lg:order-2" : "rv-left"}`}>
          <Eyebrow n={n}>{eyebrow}</Eyebrow>
          <h2 className="display-title mt-4 max-w-[13ch] text-[34px] sm:text-[42px]">{title}</h2>
          <ul className="mt-8 space-y-4">
            {items.map((t) => (
              <CheckItem key={t}>{t}</CheckItem>
            ))}
          </ul>
        </div>
        <div className={`rv rv-scale ${flip ? "lg:order-1" : ""}`} style={{ ["--rv-delay" as string]: "120ms" }}>
          {mock}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-offwhite font-sans text-inkblack antialiased">
      <ScrollReveal />

      {/* ————— Nav ————— */}
      <header className="sticky top-0 z-40 border-b border-inkblack/8 bg-offwhite/85 backdrop-blur-md">
        <nav className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-8 text-[14px] font-medium text-inkblack/60 md:flex">
            <a href="#captura" className="transition-colors hover:text-inkblack">Cómo funciona</a>
            <a href="#proceso" className="transition-colors hover:text-inkblack">Proceso</a>
            <a href="#precios" className="transition-colors hover:text-inkblack">Precios</a>
            <a href="#preguntas" className="transition-colors hover:text-inkblack">Preguntas</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3.5 py-2 text-[14px] font-medium text-inkblack/60 transition-colors hover:text-inkblack sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-inkblack px-4 py-2.5 text-[13.5px] font-bold text-white transition-all hover:bg-inkblack/85"
            >
              Ver la demo
            </Link>
          </div>
        </nav>
      </header>

      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="rv font-display text-[13px] font-bold tracking-tight text-coral">
              Un producto de synapse<span className="text-coral">.</span>
            </p>
            <h1
              className="rv display-title mx-auto mt-6 max-w-[16ch] text-[42px] sm:text-[64px]"
              style={{ ["--rv-delay" as string]: "80ms" }}
            >
              La base de datos de tus clientes se arma sola
            </h1>
            <p
              className="rv body-copy mx-auto mt-7 max-w-[52ch] text-[17px] text-inkblack/60"
              style={{ ["--rv-delay" as string]: "160ms" }}
            >
              Un QR en tu local convierte cada visita en un cliente conocido: quién es, qué consume
              y cuándo vuelve. Sin planillas. Sin adivinar.
            </p>
            <div
              className="rv mt-9 flex flex-wrap items-center justify-center gap-3"
              style={{ ["--rv-delay" as string]: "240ms" }}
            >
              <Link
                href="/demo"
                className="group flex h-12 items-center gap-2 rounded-xl bg-coral px-6 text-[15px] font-bold text-white transition-all hover:bg-coral-600"
              >
                Ver la demo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center rounded-xl border border-inkblack/15 bg-white px-6 text-[15px] font-bold text-inkblack transition-all hover:border-inkblack/30"
              >
                Crear mi cuenta
              </Link>
            </div>
            <p className="rv mt-5 text-[13px] text-inkblack/40" style={{ ["--rv-delay" as string]: "320ms" }}>
              Sin tarjeta · Tu QR listo en dos minutos
            </p>
          </div>

          <div className="rv rv-scale mx-auto mt-16 max-w-4xl" style={{ ["--rv-delay" as string]: "180ms" }}>
            <HeroMock />
          </div>
        </div>
      </section>

      {/* ————— Tesis ————— */}
      <section className="border-t border-inkblack/8 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="rv display-title text-[32px] sm:text-[40px]">
            El descuento es el gancho.
            <br />
            La información es el negocio.
          </h2>
          <p className="rv body-copy mx-auto mt-6 max-w-[54ch] text-[16px] text-inkblack/60" style={{ ["--rv-delay" as string]: "100ms" }}>
            Cientos de personas pasan por tu local todos los meses y no sabés nada de ellas. Quién
            volvió, quién no vino más, qué pide cada uno. SynapBase convierte ese anonimato en datos
            que podés usar.
          </p>
        </div>
      </section>

      {/* ————— Secciones numeradas ————— */}
      <div id="captura">
        <FeatureSection
          n="01"
          eyebrow="Captura"
          title={<>Cada visita, un cliente con nombre</>}
          items={[
            "Un QR con tu marca, listo para imprimir en PNG, SVG o PDF",
            "El cliente responde en treinta segundos desde su celular",
            "Vos definís las preguntas: consumo, contacto, lo que necesites",
          ]}
          mock={<CaptureMock />}
        />
      </div>

      <FeatureSection
        n="02"
        eyebrow="Datos"
        title={<>Sabés qué consume y cuándo vuelve</>}
        items={[
          "Visitas, frecuencia, producto favorito y gasto total, automáticos",
          "Segmentos por comportamiento real, no por corazonada",
          "Todo exportable a Excel, CSV o PDF cuando lo necesites",
        ]}
        mock={<ProfileMock />}
        flip
      />

      <FeatureSection
        n="03"
        eyebrow="Retorno"
        title={<>Mensajes que traen gente de vuelta</>}
        items={[
          "WhatsApp y email con el nombre y el gusto de cada cliente",
          "Audiencia calculada al instante antes de enviar",
          "Borradores, programación e historial de cada campaña",
        ]}
        mock={<CampaignMock />}
      />

      {/* ————— Proceso: motivo de numerales ————— */}
      <section id="proceso" className="border-t border-inkblack/8 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="rv display-title text-center text-[32px] sm:text-[40px]">Cómo empezás</h2>
          <div className="mt-14 grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {[
              ["01", "Creás tu cuenta", "Cargás el nombre de tu comercio y ya tenés tu panel con un formulario listo."],
              ["02", "Personalizás las preguntas", "Definís qué querés saber de tus clientes y con qué beneficio los invitás."],
              ["03", "Imprimís el QR", "Lo ponés en mesas, mostrador o vidriera. Desde ahí empieza a llenarse la base."],
              ["04", "Hacés que vuelvan", "Segmentás por comportamiento y mandás campañas que se sienten personales."],
            ].map(([n, title, text], i) => (
              <div
                key={n}
                className="rv border-t border-inkblack/10 pt-8"
                style={{ ["--rv-delay" as string]: `${i * 90}ms` }}
              >
                <p className="numeral text-[52px] leading-none">{n}</p>
                <h3 className="font-display mt-4 text-[21px] font-bold tracking-tight text-inkblack">{title}</h3>
                <p className="body-copy mt-2.5 max-w-[38ch] text-[15px] text-inkblack/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Franja oscura ————— */}
      <section className="bg-inkblack px-6 py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="rv rv-left">
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">
              04 — Fidelización
            </p>
            <h2 className="display-title mt-4 max-w-[14ch] text-[34px] text-white sm:text-[42px]">
              No es otro CRM. Es entender a tu gente.
            </h2>
            <p className="body-copy mt-6 max-w-[46ch] text-[16px] text-white/55">
              Un comercio no paga por un generador de formularios. Paga porque le respondés quiénes
              son sus mejores clientes, por qué dejan de venir y a quién escribirle esta semana.
            </p>
          </div>
          <div className="rv rv-right space-y-3" style={{ ["--rv-delay" as string]: "120ms" }}>
            {[
              ["Quiénes son tus mejores clientes", "Ranking por visitas y por gasto real"],
              ["Por qué dejan de venir", "Clientes perdidos y recuperados, mes a mes"],
              ["A quién le escribís esta semana", "Segmentos listos para convertir en campaña"],
            ].map(([title, text], i) => (
              <div
                key={title}
                className="rounded-xl border border-white/12 bg-white/[0.04] px-5 py-4 backdrop-blur"
                style={{ ["--rv-delay" as string]: `${140 + i * 80}ms` }}
              >
                <p className="font-display text-[15px] font-bold text-white">{title}</p>
                <p className="mt-1 text-[13.5px] text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Precios ————— */}
      <section id="precios" className="border-t border-inkblack/8 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="rv display-title text-center text-[32px] sm:text-[40px]">
            Empezá gratis. Crecé cuando lo veas funcionar.
          </h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                period: "para siempre",
                features: ["1 formulario con QR", "Hasta 100 clientes", "Panel y métricas básicas"],
                cta: "Crear cuenta",
              },
              {
                name: "Pro",
                price: "$29.900",
                period: "por mes",
                features: [
                  "Formularios y clientes ilimitados",
                  "Segmentos y campañas",
                  "Estadísticas avanzadas y exportación",
                  "QR personalizado con tu marca",
                ],
                cta: "Probar Pro",
                highlight: true,
              },
              {
                name: "Business",
                price: "$59.900",
                period: "por mes",
                features: ["Todo lo de Pro", "Múltiples sucursales", "Roles y permisos", "Soporte prioritario"],
                cta: "Hablar con ventas",
              },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`rv flex flex-col rounded-2xl border p-8 ${
                  p.highlight ? "border-coral bg-white" : "border-inkblack/12 bg-white"
                }`}
                style={{ ["--rv-delay" as string]: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[16px] font-bold text-inkblack">{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Más elegido
                    </span>
                  )}
                </div>
                <p className="mt-5">
                  <span className="font-display text-[38px] font-extrabold tracking-tight text-inkblack">
                    {p.price}
                  </span>
                  <span className="ml-2 text-[13px] text-inkblack/45">{p.period}</span>
                </p>
                <ul className="mt-7 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-coral" strokeWidth={3} />
                      <span className="body-copy text-[14px] text-inkblack/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 flex h-12 items-center justify-center rounded-xl text-[14.5px] font-bold transition-all ${
                    p.highlight
                      ? "bg-coral text-white hover:bg-coral-600"
                      : "border border-inkblack/15 text-inkblack hover:border-inkblack/35"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Preguntas frecuentes ————— */}
      <section id="preguntas" className="border-t border-inkblack/8 px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="rv rv-left lg:sticky lg:top-28 lg:self-start">
            <Eyebrow n="05">Preguntas</Eyebrow>
            <h2 className="display-title mt-4 max-w-[12ch] text-[34px] sm:text-[42px]">
              Lo que todos preguntan antes de empezar
            </h2>
            <p className="body-copy mt-5 max-w-[36ch] text-[15px] text-inkblack/60">
              Si lo tuyo no está acá, escribinos por WhatsApp y te contestamos nosotros.
            </p>
          </div>

          <div className="rv" style={{ ["--rv-delay" as string]: "100ms" }}>
            <Faq
              q="¿Mis clientes tienen que bajarse una app?"
              a="No. Escanean el QR con la cámara del celular, se abre una página web, responden y listo. No hay nada que instalar, ni de tu lado ni del de ellos."
            />
            <Faq
              q="¿Cuánto tarda una persona en completar el formulario?"
              a="Alrededor de treinta segundos. Vos elegís cuántas preguntas hacer: cuantas menos, más gente lo termina. Con el nombre y qué consumió ya tenés una ficha útil."
            />
            <Faq
              q="¿Y si no quiero dar descuento?"
              a="El descuento es el gancho más común, pero podés usar lo que quieras: un café de regalo, un sorteo mensual, puntos. Lo que importa es que haya un motivo para escanear."
            />
            <Faq
              q="¿De quién son los datos que se cargan?"
              a="Tuyos. Cada comercio ve solamente su propia base, y podés exportarla entera a CSV, Excel o PDF cuando quieras. Si te vas, te llevás tu información."
            />
            <Faq
              q="¿Sirve si tengo más de un local?"
              a="Sí. Podés generar un QR distinto por sucursal y ver los datos juntos o separados. El plan Business incluye múltiples sucursales y usuarios con permisos."
            />
            <Faq
              q="¿Necesito saber de tecnología para usarlo?"
              a="No. Creás la cuenta, elegís las preguntas, descargás el QR y lo imprimís. El panel está pensado para que lo use quien atiende, no un equipo de sistemas."
            />
            <Faq
              q="¿Puedo probarlo antes de pagar?"
              a={
                <>
                  Sí, de dos formas: mirando la{" "}
                  <Link href="/demo" className="font-semibold text-coral underline underline-offset-4">
                    demo con datos de ejemplo
                  </Link>{" "}
                  sin registrarte, o creando una cuenta Free, que no vence ni pide tarjeta.
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* ————— Contacto ————— */}
      <section id="contacto" className="border-t border-inkblack/8 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rv rounded-3xl border border-inkblack/12 bg-white p-8 sm:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <Eyebrow n="06">Contacto</Eyebrow>
                <h2 className="display-title mt-4 max-w-[16ch] text-[30px] sm:text-[38px]">
                  ¿Te quedó alguna duda? Escribinos.
                </h2>
                <p className="body-copy mt-5 max-w-[46ch] text-[15px] text-inkblack/65">
                  Contestamos nosotros, no un bot. Contanos qué tipo de local tenés y te decimos si
                  SynapBase te sirve — aunque la respuesta sea que no.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl bg-coral px-6 py-5 text-white transition-colors hover:bg-coral-600"
                >
                  <MessageCircle className="size-6 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">Escribinos por WhatsApp</span>
                    <span className="block text-[13px] text-white/80">{WHATSAPP_DISPLAY}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="group flex items-center gap-4 rounded-2xl border border-inkblack/15 px-6 py-5 text-inkblack transition-colors hover:border-inkblack/35"
                >
                  <Mail className="size-6 shrink-0 text-inkblack/45" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">Mandanos un mail</span>
                    <span className="block truncate text-[13px] text-inkblack/50">{CONTACT_EMAIL}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-inkblack/35 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Cierre ————— */}
      <section className="border-t border-inkblack/8 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="rv display-title text-[36px] sm:text-[48px]">
            Tus clientes ya entran por la puerta.
            <br />
            Empezá a conocerlos.
          </h2>
          <div className="rv mt-10 flex flex-wrap items-center justify-center gap-3" style={{ ["--rv-delay" as string]: "100ms" }}>
            <Link
              href="/demo"
              className="group flex h-12 items-center gap-2 rounded-xl bg-coral px-7 text-[15px] font-bold text-white transition-all hover:bg-coral-600"
            >
              Ver la demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="flex h-12 items-center rounded-xl border border-inkblack/15 bg-white px-7 text-[15px] font-bold text-inkblack transition-all hover:border-inkblack/30"
            >
              Crear mi cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ————— Footer ————— */}
      <footer className="border-t border-inkblack/8 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Wordmark className="text-[16px]" />
          <p className="text-[12.5px] text-inkblack/40">
            © {new Date().getFullYear()} Synapse · La base de datos inteligente para comercios
          </p>
          <div className="flex items-center gap-6 text-[13px] font-medium text-inkblack/50">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-coral"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
            <Link href="/demo" className="transition-colors hover:text-inkblack">Demo</Link>
            <Link href="/login" className="transition-colors hover:text-inkblack">Iniciar sesión</Link>
            <Link href="/register" className="transition-colors hover:text-inkblack">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
