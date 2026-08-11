import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ARTICLES, articleBySlug } from "@/lib/blog";

/** Se generan todos al compilar: son fijos y así cargan sin pensar. */
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return { title: "No encontrado · SynapBase" };
  return {
    title: `${a.title} · SynapBase`,
    description: a.description,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) notFound();

  const otros = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 2);

  return (
    <main className="min-h-dvh bg-offwhite font-sans text-inkblack antialiased">
      <header className="border-b border-inkblack/8 px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Link href="/" className="font-display text-[17px] font-extrabold tracking-tight text-inkblack">
            synapbase<span className="text-coral">.</span>
          </Link>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-coral transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Blog
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
        <p className="font-display text-[11.5px] font-bold uppercase tracking-widest text-coral">
          {a.category}
        </p>
        <h1 className="display-title mt-3 text-[29px] leading-[1.12] sm:text-[36px]">{a.title}</h1>

        {/*
          La respuesta corta va arriba de todo, antes del desarrollo. Quien
          entró con la pregunta puntual se va con lo que vino a buscar sin
          leer el resto.
        */}
        <div className="mt-8 rounded-2xl border border-coral/25 bg-white p-6">
          <p className="text-[13px] font-semibold text-inkblack/45">{a.question}</p>
          <p className="body-copy mt-2 text-[15.5px] leading-relaxed text-inkblack">{a.answer}</p>
        </div>

        <div className="mt-12 space-y-10">
          {a.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-inkblack sm:text-[21px]">
                {s.h}
              </h2>
              {s.p.map((par) => (
                <p key={par} className="body-copy mt-3.5 text-[15.5px] leading-[1.75] text-inkblack/70">
                  {par}
                </p>
              ))}
              {s.ul && (
                <ul className="mt-4 space-y-2.5">
                  {s.ul.map((li) => (
                    <li key={li} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-coral" />
                      <span className="body-copy text-[15.5px] leading-[1.7] text-inkblack/70">{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-inkblack/10 bg-white p-7 text-center">
          <p className="font-display text-[18px] font-bold tracking-[-0.02em] text-inkblack">
            Probalo con datos de ejemplo
          </p>
          <p className="body-copy mx-auto mt-2 max-w-[44ch] text-[14.5px] text-inkblack/60">
            La demo tiene un comercio armado con ocho meses de historia. No hay que registrarse.
          </p>
          <Link
            href="/demo"
            className="group mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-coral px-6 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Ver la demo
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {otros.length > 0 && (
          <div className="mt-14 border-t border-inkblack/8 pt-8">
            <p className="font-display text-[13px] font-bold tracking-tight text-inkblack/45">
              Seguir leyendo
            </p>
            <div className="mt-4 space-y-3">
              {otros.map((o) => (
                <Link
                  key={o.slug}
                  href={`/blog/${o.slug}`}
                  className="block rounded-xl border border-inkblack/10 bg-white px-5 py-4 transition-colors hover:border-coral/45"
                >
                  <p className="font-display text-[15px] font-bold tracking-[-0.02em] text-inkblack">
                    {o.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
