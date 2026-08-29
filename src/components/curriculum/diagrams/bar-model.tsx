import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "bar-model" }>;

// Singapore's "model method" — comparison bars split into labeled units.
// Used for word problems, ratio and part-whole relationships.
export function BarModelDiagram({ bars }: Props) {
  const width = 500;
  const barHeight = 32;
  const rowHeight = barHeight + 22;
  const labelWidth = 90;
  const usableWidth = width - labelWidth - 10;
  const height = bars.length * rowHeight + 6;
  const maxTotal = Math.max(...bars.map((b) => b.segments.reduce((s, seg) => s + seg.value, 0)), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg" role="img" aria-label="Bar model diagram">
      {bars.map((bar, bi) => {
        const y = bi * rowHeight + 4;
        let x = labelWidth;
        return (
          <g key={bi}>
            <text x={labelWidth - 8} y={y + barHeight / 2 + 4} fontSize={12} textAnchor="end" fontWeight={500} className="fill-foreground">
              {bar.label}
            </text>
            {bar.segments.map((seg, si) => {
              const segWidth = Math.max((seg.value / maxTotal) * usableWidth, 1);
              const rectX = x;
              x += segWidth;
              return (
                <g key={si}>
                  <rect
                    x={rectX}
                    y={y}
                    width={Math.max(segWidth - 2, 0)}
                    height={barHeight}
                    rx={3}
                    fill={seg.muted ? "var(--color-muted)" : "var(--color-primary)"}
                  />
                  <text
                    x={rectX + segWidth / 2}
                    y={y + barHeight / 2 + 4}
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    fill={seg.muted ? "var(--color-muted-foreground)" : "white"}
                  >
                    {seg.label ?? seg.value}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
