import type { DiagramSpec } from "@/lib/diagrams";

type Props = Extract<DiagramSpec, { type: "fraction" }>;

function FractionBar({ numerator, denominator, y, width }: { numerator: number; denominator: number; y: number; width: number }) {
  const segWidth = width / denominator;
  return (
    <g>
      {Array.from({ length: denominator }).map((_, i) => (
        <rect
          key={i}
          x={i * segWidth}
          y={y}
          width={Math.max(segWidth - 2, 0)}
          height={40}
          rx={2}
          fill={i < numerator ? "var(--color-primary)" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          className={i < numerator ? "text-primary" : "text-muted-foreground"}
        />
      ))}
    </g>
  );
}

function FractionCircle({ numerator, denominator, cx, cy, r }: { numerator: number; denominator: number; cx: number; cy: number; r: number }) {
  const anglePerSlice = 360 / denominator;
  return (
    <g>
      {Array.from({ length: denominator }).map((_, i) => {
        const startAngle = ((i * anglePerSlice - 90) * Math.PI) / 180;
        const endAngle = ((i * anglePerSlice - 90 + anglePerSlice) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = anglePerSlice > 180 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={i < numerator ? "var(--color-primary)" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            className={i < numerator ? "text-primary" : "text-muted-foreground"}
          />
        );
      })}
    </g>
  );
}

export function FractionDiagram({ numerator, denominator, shape = "bar", compareNumerator, compareDenominator }: Props) {
  const hasCompare = compareNumerator != null && compareDenominator != null;

  if (shape === "circle") {
    const gap = 130;
    const totalWidth = hasCompare ? 120 + gap : 120;
    return (
      <svg viewBox={`0 0 ${totalWidth} 145`} className="w-full max-w-xs" role="img" aria-label={`Fraction ${numerator} out of ${denominator}`}>
        <FractionCircle numerator={numerator} denominator={denominator} cx={60} cy={60} r={50} />
        <text x={60} y={130} fontSize={13} fontWeight={600} textAnchor="middle" className="fill-foreground">
          {numerator}/{denominator}
        </text>
        {hasCompare && (
          <>
            <FractionCircle numerator={compareNumerator} denominator={compareDenominator} cx={60 + gap} cy={60} r={50} />
            <text x={60 + gap} y={130} fontSize={13} fontWeight={600} textAnchor="middle" className="fill-foreground">
              {compareNumerator}/{compareDenominator}
            </text>
          </>
        )}
      </svg>
    );
  }

  const width = 280;
  const rowGap = 62;
  const height = hasCompare ? 10 + rowGap + 60 : 70;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs" role="img" aria-label={`Fraction ${numerator} out of ${denominator}`}>
      <FractionBar numerator={numerator} denominator={denominator} y={8} width={width} />
      <text x={width / 2} y={64} fontSize={12} fontWeight={600} textAnchor="middle" className="fill-foreground">
        {numerator}/{denominator}
      </text>
      {hasCompare && (
        <>
          <FractionBar numerator={compareNumerator} denominator={compareDenominator} y={8 + rowGap} width={width} />
          <text x={width / 2} y={64 + rowGap} fontSize={12} fontWeight={600} textAnchor="middle" className="fill-foreground">
            {compareNumerator}/{compareDenominator}
          </text>
        </>
      )}
    </svg>
  );
}
