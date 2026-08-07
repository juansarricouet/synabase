"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

/**
 * Cómo se escribe el número.
 *
 * Es una cadena y no una función porque este componente lo usan páginas que
 * corren en el servidor, y a un componente de cliente no se le pueden pasar
 * funciones como props.
 */
export type NumberFormat = "number" | "percent" | "money" | "plain";

function render(n: number, format: NumberFormat): string {
  switch (format) {
    case "percent":
      return formatPercent(n);
    case "money":
      return formatMoney(n);
    case "plain":
      return String(n);
    default:
      return formatNumber(n);
  }
}

/**
 * Número que sube desde cero cuando entra en pantalla.
 *
 * El servidor y el primer render del cliente pintan el valor final, así que la
 * hidratación coincide y quien tenga JavaScript apagado ve el dato igual. La
 * cuenta arranca recién en el efecto, después de montar.
 */
export function AnimatedNumber({
  value,
  duration = 1100,
  format = "number",
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  format?: NumberFormat;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let cancelled = false;

    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        // easeOutExpo: arranca rápido y frena sobre el final
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setDisplay(value * eased);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    setDisplay(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            run();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {render(Math.round(display), format)}
      {suffix}
    </span>
  );
}
