import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "flow" }>;

function wrapLabel(label: string, maxCharsPerLine = 13): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

// A single left-to-right row of connected steps — for linear processes
// (a system's stages, a text's structure). Keeps steps to a handful; a
// longer sequence is better split into two smaller flow diagrams.
export function FlowDiagram({ steps }: Props) {
  const boxWidth = 118;
  const boxHeight = 66;
  const gap = 40;
  const width = steps.length * boxWidth + (steps.length - 1) * gap + 16;
  const height = boxHeight + 16;
  const y = 8;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Process: ${steps.join(" then ")}`}>
      {steps.slice(0, -1).map((_, i) => {
        const x1 = 8 + i * (boxWidth + gap) + boxWidth;
        const x2 = x1 + gap;
        const midY = y + boxHeight / 2;
        return (
          <g key={`arrow-${i}`}>
            <line x1={x1} y1={midY} x2={x2 - 8} y2={midY} stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="text-muted-foreground" />
            <polygon points={`${x2},${midY} ${x2 - 8},${midY - 5} ${x2 - 8},${midY + 5}`} className="fill-muted-foreground" />
          </g>
        );
      })}
      {steps.map((step, i) => {
        const x = 8 + i * (boxWidth + gap);
        const lines = wrapLabel(step);
        const startDy = -((lines.length - 1) * 14) / 2 + boxHeight / 2 + 4;
        return (
          <g key={`box-${i}`}>
            <rect x={x} y={y} width={boxWidth} height={boxHeight} rx={8} fill="var(--color-primary)" fillOpacity={0.08} stroke="var(--color-primary)" strokeWidth={2} />
            <text x={x + boxWidth / 2} y={y + startDy} fontSize={11} fontWeight={600} textAnchor="middle" className="fill-foreground">
              {lines.map((line, li) => (
                <tspan key={li} x={x + boxWidth / 2} dy={li === 0 ? 0 : 14}>
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
