import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/blog";

/**
 * Mapa del sitio.
 *
 * Sin esto, las notas del blog quedan fuera del menú principal y hay que
 * confiar en que un buscador las descubra solo. Listarlas acá es la manera
 * derecha de que aparezcan: son páginas públicas, enlazadas y legibles por
 * cualquiera, no texto escondido para que lo lea sólo un robot.
 *
 * Quedan afuera el panel, el registro y el login: son privadas o no aportan
 * nada en un resultado de búsqueda.
 */
function baseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!v) return "https://synabase.vercel.app";
  return v.startsWith("http") ? v : `https://${v}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const ahora = new Date();

  return [
    { url: base, lastModified: ahora, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/en`, lastModified: ahora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: ahora, changeFrequency: "weekly", priority: 0.8 },
    ...ARTICLES.map((a) => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
