import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "shape-grid" }>;

// A unit-square grid for area/perimeter — shaded cells pick out the shape
// being measured against the visible 1x1 units.
export function ShapeGridDiagram({ rows, cols, shadedCells = [], caption }: Props) {
  const cell = 32;
  const padding = 10;
  const width = cols * cell + padding * 2;
  const gridHeight = rows * cell + padding * 2;
  const height = gridHeight + (caption ? 24 : 0);
  const shaded = new Set(shadedCells.map(([r, c]) => `${r}-${c}`));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs" role="img" aria-label={caption ?? `${rows} by ${cols} grid`}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={padding + c * cell}
            y={padding + r * cell}
            width={cell}
            height={cell}
            fill={shaded.has(`${r}-${c}`) ? "var(--color-primary)" : "none"}
            fillOpacity={shaded.has(`${r}-${c}`) ? 0.75 : 1}
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted-foreground"
          />
        )),
      )}
      {caption && (
        <text x={width / 2} y={gridHeight + 18} fontSize={12} textAnchor="middle" className="fill-muted-foreground">
          {caption}
        </text>
      )}
    </svg>
  );
}
