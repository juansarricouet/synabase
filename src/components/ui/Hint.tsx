"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Viñeta de ayuda: un signo de pregunta que explica para qué sirve algo.
 *
 * Se abre al pasar el mouse y también al hacer foco con el teclado, porque en
 * pantalla táctil el hover no existe. El texto vive en el DOM siempre —oculto
 * con opacidad, no con `display`— para que un lector de pantalla lo anuncie.
 */
export function Hint({
  children,
  side = "top",
  className,
}: {
  children: React.ReactNode;
  side?: "top" | "bottom" | "right";
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const pos =
    side === "bottom"
      ? "top-full mt-2 left-1/2 -translate-x-1/2"
      : side === "right"
        ? "left-full ml-2 top-1/2 -translate-y-1/2"
        : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label="Qué es esto"
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onClick={(e) => {
          e.preventDefault();
          setAbierto((v) => !v);
        }}
        className="text-ink-300 transition-colors hover:text-brand-600 focus-visible:text-brand-600 focus-visible:outline-none"
      >
        <HelpCircle className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-60 rounded-xl bg-ink-950 px-3.5 py-2.5 text-left text-[12.5px] font-normal leading-relaxed text-white shadow-pop transition-all duration-200",
          pos,
          abierto ? "opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Bloque que explica una sección entera del panel, arriba del contenido.
 *
 * Es lo primero que ve alguien que entra por primera vez a una pestaña que no
 * conoce: dice para qué sirve y qué hacer ahí, en dos líneas.
 */
export function SectionIntro({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mb-5 flex flex-wrap items-start gap-3.5 rounded-2xl border border-brand-200/60 bg-brand-50/50 px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink-950">{title}</p>
        <p className="mt-0.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-600">{children}</p>
      </div>
      {action}
    </section>
  );
}
