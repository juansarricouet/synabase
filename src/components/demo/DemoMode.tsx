"use client";

import { createContext, useContext } from "react";

const DemoContext = createContext(false);

/**
 * Marca el subárbol como panel de demostración.
 *
 * Lo provee `/demo/layout.tsx`. El valor por defecto es `false`, así que el
 * panel real no cambia y el HTML del servidor coincide con el del cliente
 * (a diferencia de mirar `window.location`, que rompería la hidratación).
 */
export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}

/** `true` cuando el componente se está renderizando dentro de `/demo`. */
export function useDemoMode(): boolean {
  return useContext(DemoContext);
}

/** Texto del `title` de cada acción inhabilitada en la demo. */
export const DEMO_HINT = "Disponible con tu cuenta — en la demo no se guardan cambios";
