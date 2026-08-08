import type { NextConfig } from "next";
import path from "path";

/**
 * Encabezados de seguridad para todas las respuestas.
 *
 * Sobre la CSP: `script-src` necesita 'unsafe-inline' porque Next inyecta los
 * datos de hidratación en scripts en línea, y 'unsafe-eval' sólo en desarrollo,
 * donde lo usa el refresco en caliente. `style-src` la necesita porque los
 * componentes usan atributos `style` para colores y anchos calculados.
 *
 * `img-src data:` es obligatorio: los logos de los comercios y los QR generados
 * se guardan y se muestran como data URI.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  // Nadie debería poder embeber el panel en un iframe ajeno.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    // Un año, incluyendo subdominios. Sólo tiene efecto sobre HTTPS.
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
