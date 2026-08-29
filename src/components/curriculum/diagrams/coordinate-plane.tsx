import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "coordinate-plane" }>;

export function CoordinatePlaneDiagram({ xRange, yRange, points = [], lines = [] }: Props) {
  const size = 260;
  const padding = 24;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const usable = size - padding * 2;
  const sx = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * usable;
  // SVG y grows downward, so flip.
  const sy = (y: number) => padding + (1 - (y - yMin) / (yMax - yMin)) * usable;

  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) yTicks.push(y);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs" role="img" aria-label="Coordinate plane">
      {xTicks.map((x) => (
        <line key={`gx-${x}`} x1={sx(x)} y1={padding} x2={sx(x)} y2={size - padding} stroke="currentColor" strokeWidth={0.5} className="text-muted-foreground/40" />
      ))}
      {yTicks.map((y) => (
        <line key={`gy-${y}`} x1={padding} y1={sy(y)} x2={size - padding} y2={sy(y)} stroke="currentColor" strokeWidth={0.5} className="text-muted-foreground/40" />
      ))}
      {/* axes, drawn at 0 if in range, else at the plane's edge */}
      <line x1={padding} y1={sy(Math.max(0, yMin))} x2={size - padding} y2={sy(Math.max(0, yMin))} stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
      <line x1={sx(Math.max(0, xMin))} y1={padding} x2={sx(Math.max(0, xMin))} y2={size - padding} stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
      {lines.map((line, i) => (
        <line
          key={`line-${i}`}
          x1={sx(line.from[0])}
          y1={sy(line.from[1])}
          x2={sx(line.to[0])}
          y2={sy(line.to[1])}
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {points.map((p, i) => (
        <g key={`pt-${i}`}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill="var(--color-primary)" />
          {p.label && (
            <text x={sx(p.x) + 8} y={sy(p.y) - 6} fontSize={11} fontWeight={600} className="fill-foreground">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
