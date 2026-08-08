/**
 * Red de sinapsis: el motivo de la marca, dibujándose solo.
 *
 * Cada visita que entra por el QR es un nodo, y las conexiones son lo que
 * SynapBase arma entre ellos. Las líneas se trazan una tras otra, los nodos
 * aparecen encima y después viaja un pulso por las conexiones.
 *
 * Es SVG y CSS puros: no necesita JavaScript ni esperar al scroll, que es
 * justo lo que hace falta en una pantalla de login.
 */

interface Node {
  x: number;
  y: number;
  r: number;
  /** El nodo central de la red, en coral. */
  hub?: boolean;
}

/* Coordenadas en el sistema del viewBox (440 × 300). */
const NODES: Node[] = [
  { x: 220, y: 150, r: 13, hub: true },
  { x: 92, y: 74 , r: 6 },
  { x: 66, y: 178, r: 7.5 },
  { x: 148, y: 246, r: 5.5 },
  { x: 300, y: 62 , r: 7 },
  { x: 372, y: 148, r: 6 },
  { x: 330, y: 244, r: 8 },
  { x: 196, y: 56 , r: 5 },
];

/** Todas salen del hub: es lo que se quiere contar, todo converge en la base. */
const LINKS = NODES.slice(1).map((n, i) => ({ to: n, i }));

function length(a: Node, b: Node): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
}

export function SynapseNetwork({ className = "" }: { className?: string }) {
  const hub = NODES[0]!;

  return (
    <svg
      viewBox="0 0 440 300"
      className={`w-full ${className}`}
      fill="none"
      aria-hidden
      role="presentation"
    >
      {/* Conexiones */}
      {LINKS.map(({ to, i }) => (
        <line
          key={`l${i}`}
          x1={hub.x}
          y1={hub.y}
          x2={to.x}
          y2={to.y}
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="1.25"
          className="syn-line"
          style={{ ["--len" as string]: length(hub, to), ["--i" as string]: i }}
        />
      ))}

      {/* Pulsos que recorren las conexiones */}
      {LINKS.map(({ to, i }) => (
        <circle
          key={`p${i}`}
          r="2.5"
          fill="var(--color-coral)"
          className="syn-pulse"
          style={{
            offsetPath: `path("M ${hub.x} ${hub.y} L ${to.x} ${to.y}")`,
            ["--i" as string]: i,
          }}
        />
      ))}

      {/* Halo del nodo central */}
      <circle
        cx={hub.x}
        cy={hub.y}
        r={hub.r + 14}
        fill="var(--color-coral)"
        fillOpacity="0.12"
        className="syn-node"
        style={{ ["--i" as string]: 0 }}
      />

      {/* Nodos */}
      {NODES.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill={n.hub ? "var(--color-coral)" : "white"}
          fillOpacity={n.hub ? 1 : 0.85}
          className="syn-node"
          style={{ ["--i" as string]: i }}
        />
      ))}
    </svg>
  );
}
