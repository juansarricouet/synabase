import { cn } from "@/lib/utils";

/**
 * Isotipo: cuadrado tinta con el punto coral de la marca.
 *
 * Es el mismo punto que cierra el wordmark de la landing, así que el panel y
 * la página pública se leen como un solo producto.
 */
export function LogoMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#111111" />
      <circle cx="21" cy="21" r="3.4" fill="var(--color-coral, #ff5a45)" />
      <path
        d="M9 20.5V13c0-1.1.9-2 2-2h5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * Wordmark del panel — mismo trazo que la landing: `synapbase` en la
 * tipografía display, con el punto en coral.
 */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  if (compact) return <LogoMark className={className} size={24} />;
  return (
    <span
      className={cn(
        "font-display inline-flex select-none items-baseline text-[17px] font-extrabold tracking-[-0.03em] text-inkblack",
        className,
      )}
    >
      synapbase
      <span className="text-coral">.</span>
    </span>
  );
}
