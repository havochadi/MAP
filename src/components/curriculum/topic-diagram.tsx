import type { DiagramSpec } from "@/lib/diagrams";
import { NumberLineDiagram } from "./diagrams/number-line";
import { BarModelDiagram } from "./diagrams/bar-model";
import { FractionDiagram } from "./diagrams/fraction";
import { RightTriangleDiagram } from "./diagrams/right-triangle";
import { ShapeGridDiagram } from "./diagrams/shape-grid";
import { CycleDiagram } from "./diagrams/cycle";
import { FlowDiagram } from "./diagrams/flow";
import { VennDiagram } from "./diagrams/venn";
import { CoordinatePlaneDiagram } from "./diagrams/coordinate-plane";

// Dispatches a DiagramSpec to its renderer. Every branch is a component
// tested against real spec shapes — see the individual files under
// ./diagrams — so a topic's diagram data can never produce broken markup,
// only (at worst) a diagram that isn't the ideal choice for that topic.
export function TopicDiagram({ spec }: { spec: DiagramSpec }) {
  switch (spec.type) {
    case "number-line":
      return <NumberLineDiagram {...spec} />;
    case "bar-model":
      return <BarModelDiagram {...spec} />;
    case "fraction":
      return <FractionDiagram {...spec} />;
    case "right-triangle":
      return <RightTriangleDiagram {...spec} />;
    case "shape-grid":
      return <ShapeGridDiagram {...spec} />;
    case "cycle":
      return <CycleDiagram {...spec} />;
    case "flow":
      return <FlowDiagram {...spec} />;
    case "venn":
      return <VennDiagram {...spec} />;
    case "coordinate-plane":
      return <CoordinatePlaneDiagram {...spec} />;
  }
}
