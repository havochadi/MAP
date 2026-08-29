// Mirrors DiagramSpec from prisma/curriculum-data/types.ts (that file is the
// authoring-side source of truth; this is the app-side copy used to render
// what's actually stored in the DB — same pattern as parseTeachingSteps /
// parseWorkedExamples in src/lib/format.ts).

export type DiagramSpec =
  | {
      type: "number-line";
      min: number;
      max: number;
      step?: number;
      highlights?: { value: number; label?: string; color?: "primary" | "green" | "red" | "amber" }[];
      jumps?: { from: number; to: number; label?: string; color?: "green" | "red" }[];
    }
  | {
      type: "bar-model";
      bars: { label: string; segments: { value: number; label?: string; muted?: boolean }[] }[];
    }
  | {
      type: "fraction";
      numerator: number;
      denominator: number;
      shape?: "bar" | "circle";
      compareNumerator?: number;
      compareDenominator?: number;
    }
  | {
      type: "right-triangle";
      legs: [string, string]; // the two sides forming the right angle
      hypotenuse: string; // the side opposite the right angle
    }
  | {
      type: "shape-grid";
      rows: number;
      cols: number;
      shadedCells?: [number, number][];
      caption?: string;
    }
  | {
      type: "cycle";
      stages: string[];
    }
  | {
      type: "flow";
      steps: string[];
    }
  | {
      type: "venn";
      setA: string;
      setB: string;
      onlyA?: string;
      onlyB?: string;
      both?: string;
    }
  | {
      type: "coordinate-plane";
      xRange: [number, number];
      yRange: [number, number];
      points?: { x: number; y: number; label?: string }[];
      lines?: { from: [number, number]; to: [number, number] }[];
    };

const VALID_TYPES = new Set<DiagramSpec["type"]>([
  "number-line",
  "bar-model",
  "fraction",
  "right-triangle",
  "shape-grid",
  "cycle",
  "flow",
  "venn",
  "coordinate-plane",
]);

// Malformed/missing data degrades to null (no diagram rendered) rather than
// throwing — same defensive pattern as the other CurriculumTopic parsers.
export function parseDiagramSpec(raw: string | null): DiagramSpec | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === "string" && VALID_TYPES.has(parsed.type)) {
      return parsed as DiagramSpec;
    }
    return null;
  } catch {
    return null;
  }
}
