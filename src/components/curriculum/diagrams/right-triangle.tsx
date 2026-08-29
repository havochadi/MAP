import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "right-triangle" }>;

// Fixed layout — right angle always at bottom-left — so legs/hypotenuse are
// unambiguous regardless of the actual triangle's real proportions. This is
// a teaching diagram, not a scale drawing.
export function RightTriangleDiagram({ legs, hypotenuse }: Props) {
  const width = 240;
  const height = 200;
  const a = { x: 24, y: 176 }; // bottom-left — the right angle
  const b = { x: 216, y: 176 }; // bottom-right
  const c = { x: 24, y: 24 }; // top-left

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs" role="img" aria-label="Right-angled triangle with labeled sides">
      <polygon
        points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
        fill="var(--color-primary)"
        fillOpacity={0.08}
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${a.x} ${a.y - 14} L ${a.x + 14} ${a.y - 14} L ${a.x + 14} ${a.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-muted-foreground"
      />
      <text x={(a.x + b.x) / 2} y={a.y + 22} fontSize={13} fontWeight={600} textAnchor="middle" className="fill-foreground">
        {legs[0]}
      </text>
      <text x={a.x - 12} y={(a.y + c.y) / 2} fontSize={13} fontWeight={600} textAnchor="end" className="fill-foreground">
        {legs[1]}
      </text>
      <text
        x={(b.x + c.x) / 2 + 14}
        y={(b.y + c.y) / 2 - 4}
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        className="fill-primary"
      >
        {hypotenuse}
      </text>
    </svg>
  );
}
