"use client";

import { useEffect } from "react";

/**
 * Activa las animaciones de entrada al hacer scroll.
 *
 * Observa los elementos con clase `.rv` (contenido) y `.mock` (maquetas
 * animadas) y les agrega `.in` cuando entran en pantalla. Se usa una sola vez
 * por elemento: la animación no se repite al volver a subir.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv, .mock");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
