"use client";

import { useEffect } from "react";

/**
 * Efectos ligados al scroll de la landing:
 *
 * 1. Una barra fina de progreso de lectura arriba de todo.
 * 2. El encabezado se compacta y toma sombra apenas te alejás del inicio.
 *
 * Todo se escribe como variables CSS y clases, no como estado de React: el
 * scroll dispara muchísimos eventos y volver a renderizar en cada uno haría
 * que la página se sienta pesada. El trabajo real queda en un
 * requestAnimationFrame, así como mucho se actualiza una vez por cuadro.
 */
export function ScrollFx() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    const header = document.getElementById("landing-header");
    if (!bar && !header) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const y = window.scrollY;
      if (bar) bar.style.setProperty("--p", String(max > 0 ? Math.min(1, y / max) : 0));
      if (header) header.classList.toggle("is-stuck", y > 12);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
