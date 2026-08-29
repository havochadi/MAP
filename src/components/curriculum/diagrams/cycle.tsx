import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "cycle" }>;

// Splits a short label onto at most 2 lines at the nearest word boundary to
// its midpoint, since SVG <text> doesn't auto-wrap.
function splitLabel(label: string): [string] | [string, string] {
  const words = label.split(" ");
  if (words.length < 2) return [label];
  let bestIndex = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

export function CycleDiagram({ stages }: Props) {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const nodeRadius = 44;
  const n = stages.length;

  const positions = stages.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs" role="img" aria-label={`Cycle: ${stages.join(" then ")}, repeating`}>
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % n];
        const dx = next.x - pos.x;
        const dy = next.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const startX = pos.x + ux * (nodeRadius + 2);
        const startY = pos.y + uy * (nodeRadius + 2);
        const endX = next.x - ux * (nodeRadius + 10);
        const endY = next.y - uy * (nodeRadius + 10);
        return (
          <g key={`arrow-${i}`}>
            <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="text-muted-foreground" />
            <polygon
              points={`${endX},${endY} ${endX - uy * 5 - ux * 8},${endY + ux * 5 - uy * 8} ${endX + uy * 5 - ux * 8},${endY - ux * 5 - uy * 8}`}
              className="fill-muted-foreground"
            />
          </g>
        );
      })}
      {positions.map((pos, i) => {
        const lines = splitLabel(stages[i]);
        return (
          <g key={`node-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={nodeRadius} fill="var(--color-primary)" fillOpacity={0.1} stroke="var(--color-primary)" strokeWidth={2} />
            <text x={pos.x} y={pos.y + (lines.length > 1 ? -2 : 4)} fontSize={11} fontWeight={600} textAnchor="middle" className="fill-foreground">
              {lines.map((line, li) => (
                <tspan key={li} x={pos.x} dy={li === 0 ? 0 : 14}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
