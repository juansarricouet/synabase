import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Globe, Mail, MessageCircle } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { ScrollFx } from "@/components/landing/ScrollFx";
import { CampaignMock, CaptureMock, HeroMock, ProfileMock } from "@/components/landing/Mocks";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, mailtoUrl, whatsappUrl } from "@/lib/contact";
import { COPY, TRIAL_FAQ, planPrice, type Lang } from "@/lib/landing-copy";

/** Marca de palabra al estilo Synapse: minúsculas, bold y punto en coral. */
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[19px] font-extrabold tracking-tight text-inkblack ${className}`}>
      synapbase<span className="text-coral">.</span>
    </span>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-left">
      <Check className="mt-0.5 size-4 shrink-0 text-inkblack" strokeWidth={3} />
      <span className="body-copy text-[15px] text-inkblack/75">{children}</span>
    </li>
  );
}

/**
 * Pregunta frecuente sobre `<details>` nativo: funciona sin JavaScript y se
 * abre con altura animada gracias al truco de `grid-template-rows` (.acc-body).
 */
function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group border-b border-inkblack/10 text-left">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-[16.5px] font-bold tracking-[-0.02em] text-inkblack transition-colors group-hover:text-coral sm:text-[19px]">
          {q}
        </h3>
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-inkblack/12 transition-all duration-300 group-hover:border-coral/40 group-open:rotate-180 group-open:border-coral/40 group-open:bg-coral/8">
          <ChevronDown className="size-3.5 text-inkblack/45 transition-colors group-open:text-coral" />
        </span>
      </summary>
      <div className="acc-body">
        <div>
          <div className="body-copy max-w-[62ch] pb-5 text-[15px] text-inkblack/65 sm:pr-10">{a}</div>
        </div>
      </div>
    </details>
  );
}

/**
 * Sección numerada: texto de un lado, maqueta del otro, alternando.
 *
 * En celular se apila y todo queda centrado; el `min-w-0` es lo que evita que
 * la maqueta —que tiene piezas de ancho fijo— estire la columna y empuje al
 * texto fuera de la pantalla.
 */
function FeatureSection({
  title,
  items,
  mock,
  flip = false,
  id,
}: {
  title: string;
  items: string[];
  mock: React.ReactNode;
  flip?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-inkblack/8 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div className={`rv min-w-0 text-center lg:text-left ${flip ? "rv-right lg:order-2" : "rv-left"}`}>
          <h2 className="display-title mx-auto max-w-[13ch] text-[30px] sm:text-[38px] lg:mx-0 lg:text-[42px]">
            {title}
          </h2>
          <ul className="mx-auto mt-8 inline-flex max-w-md flex-col gap-4 lg:mx-0 lg:flex lg:max-w-none">
            {items.map((t) => (
              <CheckItem key={t}>{t}</CheckItem>
            ))}
          </ul>
        </div>
        <div
          className={`rv rv-scale min-w-0 ${flip ? "lg:order-1" : ""}`}
          style={{ ["--rv-delay" as string]: "120ms" }}
        >
          {mock}
        </div>
      </div>
    </section>
  );
}

/** Titular que entra línea por línea desde su máscara. */
function LinesTitle({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <h2 className={className}>
      {lines.map((line, i) => (
        <span key={line} className="line-mask" style={{ ["--i" as string]: i }}>
          <span>{line}</span>
        </span>
      ))}
    </h2>
  );
}

/** La landing completa. Las rutas `/` y `/en` sólo cambian este parámetro. */
export function Landing({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const trial = TRIAL_FAQ[lang];
  const mocks = [<CaptureMock key="c" lang={lang} />, <ProfileMock key="p" lang={lang} />, <CampaignMock key="m" lang={lang} />];

  return (
    // El <html> del layout raíz está en español; marcar el idioma acá hace que
    // lectores de pantalla y traductores traten bien la versión en inglés.
    <div lang={t.htmlLang} className="min-h-dvh overflow-x-clip bg-offwhite font-sans text-inkblack antialiased">
      <ScrollReveal />
      <ScrollFx />
      <div id="scroll-progress" className="scroll-progress" />

      {/* ————— Nav ————— */}
      <header
        id="landing-header"
        className="landing-header sticky top-0 z-40 border-b border-inkblack/8 bg-offwhite/85 backdrop-blur-md"
      >
        <nav className="header-inner mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 sm:px-6">
          <Link href={lang === "es" ? "/" : "/en"} className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-8 text-[14px] font-medium text-inkblack/60 md:flex">
            {[
              ["#captura", t.nav.howItWorks],
              ["#proceso", t.nav.process],
              ["#precios", t.nav.pricing],
              ["#preguntas", t.nav.faq],
            ].map(([href, label]) => (
              <a key={href} href={href} className="group relative transition-colors hover:text-inkblack">
                {label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-coral transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={t.switchHref}
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-inkblack/12 px-2.5 py-2 text-[12.5px] font-bold text-inkblack/60 transition-all hover:border-inkblack/30 hover:text-inkblack"
            >
              <Globe className="size-3.5" />
              {t.switchTo}
            </Link>
            <Link
              href="/login"
              className="hidden rounded-lg px-3.5 py-2 text-[14px] font-medium text-inkblack/60 transition-colors hover:text-inkblack lg:block"
            >
              {t.login}
            </Link>
            <Link
              href="/demo"
              className="sheen whitespace-nowrap rounded-lg bg-inkblack px-3.5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-inkblack/85 sm:px-4 sm:text-[13.5px]"
            >
              {t.seeDemo}
            </Link>
          </div>
        </nav>
      </header>

      {/* ————— Hero ————— */}
      <section className="relative px-6 pb-16 pt-16 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            {/* Lleva a la agencia que está atrás del producto: quien quiera
                saber quiénes somos tiene dónde ir sin salir a buscarlo. */}
            <a
              href="https://www.synapse.place/"
              target="_blank"
              rel="noopener noreferrer"
              className="rv font-display inline-flex items-center gap-2 text-[13px] font-bold tracking-tight text-coral transition-opacity hover:opacity-70"
            >
              <span className="live-dot size-1.5 shrink-0 rounded-full bg-coral" />
              <span>{t.hero.eyebrow}</span>
            </a>
            <LinesTitle
              lines={t.hero.titleLines}
              className="rv display-title mx-auto mt-6 max-w-[16ch] text-[36px] sm:text-[52px] lg:text-[64px]"
            />
            <p
              className="rv body-copy mx-auto mt-6 max-w-[52ch] text-[16px] text-inkblack/60 sm:mt-7 sm:text-[17px]"
              style={{ ["--rv-delay" as string]: "160ms" }}
            >
              {t.hero.subtitle}
            </p>
            <div
              className="rv mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9"
              style={{ ["--rv-delay" as string]: "240ms" }}
            >
              <Link
                href="/demo"
                className="sheen group flex h-12 items-center gap-2 rounded-xl bg-coral px-6 text-[15px] font-bold text-white transition-all hover:bg-coral-600"
              >
                {t.seeDemo}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center rounded-xl border border-inkblack/15 bg-white px-6 text-[15px] font-bold text-inkblack transition-all hover:border-inkblack/30"
              >
                {t.createAccount}
              </Link>
            </div>
            <p className="rv mt-5 text-[13px] text-inkblack/40" style={{ ["--rv-delay" as string]: "320ms" }}>
              {t.hero.note}
            </p>
          </div>

          <div className="rv rv-scale mx-auto mt-14 max-w-4xl sm:mt-16" style={{ ["--rv-delay" as string]: "180ms" }}>
            <div className="floaty">
              <HeroMock lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ————— Cinta: lo que sabés de cada cliente ————— */}
      <section className="border-y border-inkblack/8 bg-white py-5">
        <div className="marquee">
          {/* La lista va dos veces: cuando la primera copia termina de salir,
              la segunda ya está en su lugar y el loop no se corta. */}
          <div>
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                {t.marquee.map((label) => (
                  <span key={label} className="flex items-center whitespace-nowrap">
                    <span className="font-display px-6 text-[14px] font-bold tracking-tight text-inkblack/70 sm:px-7 sm:text-[15px]">
                      {label}
                    </span>
                    <span className="size-1.5 shrink-0 rounded-full bg-coral" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Tesis ————— */}
      <section className="border-t border-inkblack/8 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <LinesTitle lines={t.thesis.titleLines} className="rv display-title text-[27px] sm:text-[36px] lg:text-[40px]" />
          <p
            className="rv body-copy mx-auto mt-6 max-w-[54ch] text-[16px] text-inkblack/60"
            style={{ ["--rv-delay" as string]: "100ms" }}
          >
            {t.thesis.body}
          </p>
        </div>
      </section>

      {/*
        ————— Delivery —————

        El caso del que vende por apps de pedidos. Se le da lugar propio y no
        una viñeta más porque es la razón más concreta para contratar esto: el
        comercio ya está pagando comisión por clientes que no puede volver a
        contactar. No se nombra ninguna plataforma.
      */}
      <section id="delivery" className="scroll-mt-24 border-t border-inkblack/8 px-6 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="rv text-center">
            <LinesTitle
              lines={t.delivery.titleLines}
              className="display-title mx-auto max-w-[18ch] text-[28px] sm:text-[36px] lg:text-[42px]"
            />
            <p className="body-copy mx-auto mt-6 max-w-[58ch] text-[16px] text-inkblack/60">
              {t.delivery.body}
            </p>
          </div>

          <div className="stagger mt-12 grid gap-5 sm:grid-cols-3">
            {t.delivery.points.map((p, i) => (
              <div
                key={p.title}
                className="rv rounded-2xl border border-inkblack/10 bg-white p-6 text-left"
                style={{ ["--rv-delay" as string]: `${i * 90}ms` }}
              >
                <span className="font-display flex size-7 items-center justify-center rounded-full bg-inkblack text-[12px] font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-display mt-4 text-[16px] font-bold tracking-[-0.02em] text-inkblack">
                  {p.title}
                </h3>
                <p className="body-copy mt-2 text-[14.5px] leading-relaxed text-inkblack/60">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Secciones de producto ————— */}
      {t.features.map((f, i) => (
        <FeatureSection
          key={f.n}
          id={i === 0 ? "captura" : undefined}
          title={f.title}
          items={f.items}
          mock={mocks[i]}
          flip={i === 1}
        />
      ))}

      {/* ————— Proceso ————— */}
      <section id="proceso" className="scroll-mt-24 border-t border-inkblack/8 px-6 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="rv display-title text-center text-[27px] sm:text-[36px] lg:text-[40px]">
            {t.process.heading}
          </h2>
          <div className="mt-12 grid gap-x-14 gap-y-10 text-center sm:mt-14 sm:grid-cols-2 sm:text-left">
            {t.process.steps.map((step, i) => (
              <div
                key={step.n}
                className="rv group border-t border-inkblack/10 pt-7 transition-colors hover:border-coral/40 sm:pt-8"
                style={{ ["--rv-delay" as string]: `${i * 90}ms` }}
              >
                <p className="numeral text-[46px] leading-none transition-transform duration-300 group-hover:scale-110 sm:origin-left sm:text-[52px]">
                  {step.n}
                </p>
                <h3 className="font-display mt-3.5 text-[19px] font-bold tracking-tight text-inkblack sm:text-[21px]">
                  {step.title}
                </h3>
                <p className="body-copy mx-auto mt-2.5 max-w-[38ch] text-[15px] text-inkblack/60 sm:mx-0">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Franja oscura ————— */}
      <section className="bg-inkblack px-6 py-16 text-white sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 text-center lg:grid-cols-2 lg:gap-16 lg:text-left">
          <div className="rv rv-left min-w-0">
            <p className="font-display text-[13px] font-bold tracking-tight text-coral">{t.dark.eyebrow}</p>
            <h2 className="display-title mx-auto mt-4 max-w-[14ch] text-[30px] text-white sm:text-[38px] lg:mx-0 lg:text-[42px]">
              {t.dark.title}
            </h2>
            <p className="body-copy mx-auto mt-6 max-w-[46ch] text-[16px] text-white/55 lg:mx-0">{t.dark.body}</p>
          </div>
          <div className="rv rv-right min-w-0 space-y-3 text-left" style={{ ["--rv-delay" as string]: "120ms" }}>
            {t.dark.cards.map((c, i) => (
              <div
                key={c.title}
                className="rounded-xl border border-white/12 bg-white/[0.04] px-5 py-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-coral/35 hover:bg-white/[0.07]"
                style={{ ["--rv-delay" as string]: `${140 + i * 80}ms` }}
              >
                <p className="font-display text-[15px] font-bold text-white">{c.title}</p>
                <p className="mt-1 text-[13.5px] text-white/50">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Precios ————— */}
      <section id="precios" className="scroll-mt-24 border-t border-inkblack/8 px-6 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="rv display-title text-center text-[27px] sm:text-[36px] lg:text-[40px]">
            {t.pricing.heading}
          </h2>
          <div className="mt-12 grid gap-6 sm:mt-14 lg:grid-cols-3">
            {t.pricing.plans.map((p, i) => {
              const { price, period } = planPrice(p, lang);
              return (
                <div
                  key={p.name}
                  className={`rv lift flex flex-col rounded-2xl border p-7 text-left sm:p-8 ${
                    p.highlight
                      ? "border-coral bg-white shadow-[0_20px_60px_-30px_rgb(255_90_69/0.55)]"
                      : "border-inkblack/12 bg-white"
                  }`}
                  style={{ ["--rv-delay" as string]: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-[16px] font-bold text-inkblack">{p.name}</h3>
                    {p.highlight && (
                      <span className="whitespace-nowrap rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        {lang === "es" ? "Más elegido" : "Most popular"}
                      </span>
                    )}
                  </div>
                  <p className="mt-5">
                    <span className="font-display text-[34px] font-extrabold tracking-tight text-inkblack sm:text-[38px]">
                      {price}
                    </span>
                    <span className="ml-2 text-[13px] text-inkblack/45">{period}</span>
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
                    className={`sheen mt-8 flex h-12 items-center justify-center rounded-xl text-[14.5px] font-bold transition-all ${
                      p.highlight
                        ? "bg-coral text-white hover:bg-coral-600"
                        : "border border-inkblack/15 text-inkblack hover:border-inkblack/35"
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ————— Preguntas frecuentes ————— */}
      <section id="preguntas" className="scroll-mt-24 border-t border-inkblack/8 px-6 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="rv rv-left min-w-0 text-center lg:sticky lg:top-28 lg:self-start lg:text-left">
            <h2 className="display-title mx-auto max-w-[12ch] text-[30px] sm:text-[38px] lg:mx-0 lg:text-[42px]">
              {t.faq.title}
            </h2>
            <p className="body-copy mx-auto mt-5 max-w-[36ch] text-[15px] text-inkblack/60 lg:mx-0">
              {t.faq.note}
            </p>
          </div>

          <div className="rv min-w-0" style={{ ["--rv-delay" as string]: "100ms" }}>
            {t.faq.items.map((item) => (
              <Faq key={item.q} q={item.q} a={item.a} />
            ))}
            <Faq
              q={trial.q}
              a={
                <>
                  {trial.before}
                  <Link href="/demo" className="font-semibold text-coral underline underline-offset-4">
                    {t.faqDemoLabel}
                  </Link>
                  {trial.after}
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* ————— Contacto ————— */}
      <section id="contacto" className="scroll-mt-24 border-t border-inkblack/8 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rv rounded-3xl border border-inkblack/12 bg-white p-7 sm:p-12">
            <div className="grid items-center gap-9 text-center lg:grid-cols-[1.1fr_0.9fr] lg:text-left">
              <div className="min-w-0">
                <h2 className="display-title mx-auto max-w-[16ch] text-[27px] sm:text-[34px] lg:mx-0 lg:text-[38px]">
                  {t.contact.title}
                </h2>
                <p className="body-copy mx-auto mt-5 max-w-[46ch] text-[15px] text-inkblack/65 lg:mx-0">
                  {t.contact.body}
                </p>
              </div>

              <div className="flex min-w-0 flex-col gap-3 text-left">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheen lift group flex items-center gap-4 rounded-2xl bg-coral px-5 py-5 text-white transition-colors hover:bg-coral-600 sm:px-6"
                >
                  <MessageCircle className="size-6 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">{t.contact.whatsapp}</span>
                    <span className="block truncate text-[13px] text-white/80">{WHATSAPP_DISPLAY}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>

                <a
                  href={mailtoUrl}
                  className="lift group flex items-center gap-4 rounded-2xl border border-inkblack/15 px-5 py-5 text-inkblack transition-colors hover:border-inkblack/35 sm:px-6"
                >
                  <Mail className="size-6 shrink-0 text-inkblack/45" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">{t.contact.email}</span>
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
      <section className="border-t border-inkblack/8 px-6 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <LinesTitle lines={t.closing.titleLines} className="rv display-title text-[30px] sm:text-[42px] lg:text-[48px]" />
          <div
            className="rv mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ ["--rv-delay" as string]: "100ms" }}
          >
            <Link
              href="/demo"
              className="sheen group flex h-12 items-center gap-2 rounded-xl bg-coral px-7 text-[15px] font-bold text-white transition-all hover:bg-coral-600"
            >
              {t.seeDemo}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register"
              className="flex h-12 items-center rounded-xl border border-inkblack/15 bg-white px-7 text-[15px] font-bold text-inkblack transition-all hover:border-inkblack/30"
            >
              {t.createAccount}
            </Link>
          </div>
        </div>
      </section>

      {/* ————— Footer ————— */}
      <footer className="border-t border-inkblack/8 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <Wordmark className="text-[16px]" />
          <p className="order-last text-[12.5px] text-inkblack/40 sm:order-none">
            © {new Date().getFullYear()} {t.footer.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-inkblack/50">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-coral"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
            <Link href="/demo" className="transition-colors hover:text-inkblack">{t.footer.demo}</Link>
            <Link href="/login" className="transition-colors hover:text-inkblack">{t.footer.login}</Link>
            <Link href="/register" className="transition-colors hover:text-inkblack">{t.footer.register}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
