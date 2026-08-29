// Shared shape for the per-subject curriculum data files in this directory.
// Each file exports an array of these, one entry per level, consumed by
// prisma/seed.ts to populate CurriculumTopic rows.

export type CurriculumLevel = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "SEC1" | "SEC2" | "SEC3" | "SEC4";

export type WorkedExample = {
  // The actual problem/prompt/question — concrete and specific, e.g. a real
  // math computation with real numbers, a real science calculation, or a
  // real example sentence/passage with an instruction ("Identify the
  // adverb in this sentence and explain what it modifies.").
  problem: string;
  // The full worked solution, broken into ordered steps ending in the
  // answer — not just the final answer. Someone with no other context
  // should be able to follow the reasoning from problem to answer.
  solution: string[];
};

// A simple diagram, described as structured data rather than hand-authored
// SVG — a fixed set of renderer components (src/components/curriculum/
// topic-diagram.tsx) turns this into an actual drawing. This is deliberate:
// hand-written SVG path/coordinate data is exactly the kind of thing that's
// easy to get subtly wrong (misaligned points, broken paths), so content
// authors only ever supply plain data, and a tested component guarantees
// what gets drawn is always valid and visually consistent.
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

export type CurriculumTopicSeed = {
  title: string;
  strand: string;
  description: string;
  // A thorough explanation of the underlying concept/content itself — what
  // it actually IS and why it works, written as content/theory rather than
  // as instructions to a tutor (that's what teachingSteps is for).
  conceptExplanation: string;
  // 2-3 fully worked example problems with step-by-step solutions.
  workedExamples: WorkedExample[];
  // An ordered, step-by-step lesson sequence for actually teaching this
  // topic — not a restatement of the description. Each entry is one
  // concrete step a coach follows in order (hook/warm-up, introduce the
  // concept, model it, guided practice, independent practice, check for
  // understanding / common errors, extension or link to what comes next).
  teachingSteps: string[];
  // Optional — only for topics where a simple diagram genuinely helps.
  // Not every topic needs one (most English topics won't).
  diagram?: DiagramSpec;
};

export type LevelCurriculum = {
  level: CurriculumLevel;
  topics: CurriculumTopicSeed[];
};
