import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "number-line" }>;

const HIGHLIGHT_COLOR: Record<NonNullable<Props["highlights"]>[number]["color"] & string, string> = {
  primary: "var(--color-primary)",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
};

export function NumberLineDiagram({ min, max, step = 1, highlights = [], jumps = [] }: Props) {
  const width = 560;
  const height = jumps.length > 0 ? 120 : 90;
  const padding = 28;
  const axisY = jumps.length > 0 ? 70 : 44;
  const usableWidth = width - padding * 2;
  const scale = (v: number) => padding + ((v - min) / (max - min)) * usableWidth;

  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md" role="img" aria-label={`Number line from ${min} to ${max}`}>
      <line
        x1={scale(min)}
        y1={axisY}
        x2={scale(max)}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="text-muted-foreground"
      />
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={scale(v)}
            y1={axisY - 6}
            x2={scale(v)}
            y2={axisY + 6}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-muted-foreground"
          />
          <text x={scale(v)} y={axisY + 22} fontSize={11} textAnchor="middle" className="fill-muted-foreground">
            {v}
          </text>
        </g>
      ))}
      {jumps.map((j, i) => {
        const x1 = scale(j.from);
        const x2 = scale(j.to);
        const midX = (x1 + x2) / 2;
        const color = j.color === "red" ? HIGHLIGHT_COLOR.red : HIGHLIGHT_COLOR.green;
        const dir = x2 > x1 ? 1 : -1;
        return (
          <g key={i}>
            <path d={`M ${x1} ${axisY} Q ${midX} ${axisY - 32} ${x2} ${axisY}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <polygon
              points={`${x2},${axisY} ${x2 - dir * 7},${axisY - 5} ${x2 - dir * 7},${axisY + 5}`}
              fill={color}
            />
            {j.label && (
              <text x={midX} y={axisY - 38} fontSize={11} fontWeight={600} textAnchor="middle" fill={color}>
                {j.label}
              </text>
            )}
          </g>
        );
      })}
      {highlights.map((h, i) => {
        const color = HIGHLIGHT_COLOR[h.color ?? "primary"];
        return (
          <g key={i}>
            <circle cx={scale(h.value)} cy={axisY} r={5} fill={color} />
            {h.label && (
              <text x={scale(h.value)} y={axisY + 40} fontSize={11} fontWeight={600} textAnchor="middle" fill={color}>
                {h.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
