import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "venn" }>;

export function VennDiagram({ setA, setB, onlyA, onlyB, both }: Props) {
  const width = 320;
  const height = 190;
  const r = 75;
  const leftCx = width / 2 - 40;
  const rightCx = width / 2 + 40;
  const cy = 95;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-sm" role="img" aria-label={`Venn diagram of ${setA} and ${setB}`}>
      <circle cx={leftCx} cy={cy} r={r} fill="var(--color-primary)" fillOpacity={0.12} stroke="var(--color-primary)" strokeWidth={2} />
      <circle cx={rightCx} cy={cy} r={r} fill="#16a34a" fillOpacity={0.12} stroke="#16a34a" strokeWidth={2} />
      <text x={leftCx - 40} y={30} fontSize={12} fontWeight={600} textAnchor="middle" className="fill-foreground">
        {setA}
      </text>
      <text x={rightCx + 40} y={30} fontSize={12} fontWeight={600} textAnchor="middle" className="fill-foreground">
        {setB}
      </text>
      {onlyA && (
        <text x={leftCx - 32} y={cy} fontSize={11} textAnchor="middle" className="fill-foreground">
          {onlyA}
        </text>
      )}
      {onlyB && (
        <text x={rightCx + 32} y={cy} fontSize={11} textAnchor="middle" className="fill-foreground">
          {onlyB}
        </text>
      )}
      {both && (
        <text x={width / 2} y={cy} fontSize={11} fontWeight={600} textAnchor="middle" className="fill-foreground">
          {both}
        </text>
      )}
    </svg>
  );
}
