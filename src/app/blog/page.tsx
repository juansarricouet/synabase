import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ARTICLES } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog · SynapBase",
  description:
    "Guías sobre cómo armar la base de clientes de un local: qué preguntar, qué ofrecer para que escaneen el QR y cómo recuperar a los clientes que llegan por apps de pedidos.",
};

/**
 * Índice del blog.
 *
 * Es el desarrollo largo de las preguntas frecuentes de la portada. No está en
 * el menú principal —quien viene a contratar no necesita pasar por acá— pero es
 * una página pública y normal: cualquiera la abre, la lee y la puede compartir.
 */
export default function BlogIndex() {
  return (
    <main className="min-h-dvh bg-offwhite font-sans text-inkblack antialiased">
      <header className="border-b border-inkblack/8 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="font-display text-[17px] font-extrabold tracking-tight text-inkblack">
            synapbase<span className="text-coral">.</span>
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-coral transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Inicio
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <p className="font-display text-[13px] font-bold tracking-tight text-coral">Blog</p>
        <h1 className="display-title mt-3 max-w-[18ch] text-[30px] sm:text-[38px]">
          Guías para conocer a los clientes de tu local
        </h1>
        <p className="body-copy mt-4 max-w-[54ch] text-[15.5px] text-inkblack/60">
          Las preguntas que nos hacen todo el tiempo, respondidas en serio. Sin vueltas y sin humo.
        </p>

        <div className="mt-11 space-y-4">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group block rounded-2xl border border-inkblack/10 bg-white p-6 transition-colors hover:border-coral/45 sm:p-7"
            >
              <p className="font-display text-[11.5px] font-bold uppercase tracking-widest text-coral">
                {a.category}
              </p>
              <h2 className="font-display mt-2.5 text-[19px] font-bold leading-snug tracking-[-0.02em] text-inkblack sm:text-[21px]">
                {a.title}
              </h2>
              <p className="body-copy mt-2 text-[14.5px] leading-relaxed text-inkblack/60">
                {a.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-coral">
                Leer
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-inkblack/8 px-6 py-9">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 text-[12.5px] text-inkblack/40">
          <p>© {new Date().getFullYear()} SynapBase</p>
          <div className="flex gap-5">
            <Link href="/demo" className="transition-colors hover:text-inkblack">Ver la demo</Link>
            <Link href="/register" className="transition-colors hover:text-inkblack">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
