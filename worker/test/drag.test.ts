import { describe, expect, it } from "vitest";
import { dist, dragTo, evaluateFigureCheck, isDraggable, resolveFigure, type Override } from "../../shared/src/geometry";
import type { Figure, PointDef } from "../../shared/src/solution";

const P = (id: string, kind: PointDef["kind"], extra: Partial<PointDef> = {}): PointDef => ({
  id, label: id, kind, refs: [], x: null, y: null, value: null, value2: null, draggable: false, hidden: false, ...extra,
});

const figure: Figure = {
  scale: "schematic",
  points: [
    P("A", "free", { x: 0, y: 4 }),
    P("B", "free", { x: -3, y: 0 }),
    P("C", "free", { x: 5, y: 0 }),
    P("H", "foot", { refs: ["A", "B", "C"] }),
    P("M", "midpoint", { refs: ["B", "C"] }),
    P("D", "on_segment", { refs: ["B", "C"], value: 0.25 }),
    P("O", "free", { x: 10, y: 10 }),
    P("E", "on_circle", { refs: ["c"], value: 0 }),
    P("T", "tangent", { refs: ["A", "c"], value: 0 }),
  ],
  lines: [],
  circles: [{ id: "c", center: "O", through: null, radius: 2, style: "given", label: null }],
  angles: [],
  marks: [],
  checks: [
    { kind: "perpendicular", refs: ["A", "H", "B", "C"], value: null, role: "derived" },
    { kind: "length_value", refs: ["B", "C"], value: 8, role: "given" },
  ],
};
const def = (id: string) => figure.points.find((p) => p.id === id)!;

describe("GeoGebra-style dragging", () => {
  it("only free points and points on objects are draggable", () => {
    expect(["A", "D", "E"].every((id) => isDraggable(def(id)))).toBe(true);
    expect(["H", "M", "T"].some((id) => isDraggable(def(id)))).toBe(false);
  });

  it("dragging a vertex re-constructs everything that depends on it", () => {
    const overrides: Record<string, Override> = { A: dragTo(def("A"), resolveFigure(figure), { x: 3, y: 6 })! };
    const r = resolveFigure(figure, overrides);
    expect(r.points.A).toEqual({ x: 3, y: 6 });
    expect(r.points.H!.x).toBeCloseTo(3); // foot of the perpendicular followed A
    expect(evaluateFigureCheck(figure.checks[0]!, r).passed).toBe(true); // AH ⊥ BC still holds
    const c = r.circles.c!;
    const T = r.points.T!;
    expect((T.x - c.cx) * (r.points.A!.x - T.x) + (T.y - c.cy) * (r.points.A!.y - T.y)).toBeCloseTo(0, 6); // still tangent
  });

  it("dragging an endpoint keeps the midpoint a midpoint", () => {
    const r = resolveFigure(figure, { C: { x: 9, y: 2 } });
    expect(r.points.M).toEqual({ x: 3, y: 1 });
  });

  it("a point on a segment slides along it and stays between the endpoints", () => {
    const r0 = resolveFigure(figure);
    const along = dragTo(def("D"), r0, { x: 3, y: 5 })!; // off the line: projected
    const r = resolveFigure(figure, { D: along });
    expect(r.points.D!.y).toBeCloseTo(0);
    expect(r.points.D!.x).toBeCloseTo(3);
    const beyond = dragTo(def("D"), r0, { x: 50, y: 0 }) as { value: number };
    expect(beyond.value).toBeLessThan(1);
  });

  it("a point on a circle moves around it", () => {
    const r0 = resolveFigure(figure);
    const r = resolveFigure(figure, { E: dragTo(def("E"), r0, { x: 10, y: 30 })! });
    expect(dist(r.points.E!, { x: 10, y: 10 })).toBeCloseTo(2);
    expect(r.points.E!.y).toBeCloseTo(12);
  });

  it("dependent points can't be dragged", () => {
    expect(dragTo(def("H"), resolveFigure(figure), { x: 0, y: 0 })).toBeNull();
  });

  it("reports when a drag breaks a given of the problem", () => {
    expect(evaluateFigureCheck(figure.checks[1]!, resolveFigure(figure)).passed).toBe(true);
    expect(evaluateFigureCheck(figure.checks[1]!, resolveFigure(figure, { C: { x: 9, y: 0 } })).passed).toBe(false);
  });
});

describe("polar and constraint-preserving constructions", () => {
  it("dragging a polar point changes its distance and direction", () => {
    const f: Figure = { ...figure, points: [P("A", "free", { x: 0, y: 0 }), P("B", "polar", { refs: ["A"], value: 0, value2: 5 })] };
    const r0 = resolveFigure(f);
    const r = resolveFigure(f, { B: dragTo(f.points[1]!, r0, { x: 0, y: 3 })! });
    expect(r.points.B!.x).toBeCloseTo(0);
    expect(r.points.B!.y).toBeCloseTo(3);
  });

  it("a right angle built with rotate + on_segment survives dragging the vertices", () => {
    const f: Figure = {
      ...figure,
      points: [
        P("A", "free", { x: 0, y: 0 }),
        P("B", "free", { x: 4, y: 0 }),
        P("R", "rotate", { refs: ["B", "A"], value: 90, hidden: true }),
        P("C", "on_segment", { refs: ["A", "R"], value: 0.75 }),
      ],
      checks: [{ kind: "angle_value", refs: ["B", "A", "C"], value: 90, role: "given" }],
    };
    const drags: Record<string, Override>[] = [{ A: { x: 1, y: 2 } }, { B: { x: -3, y: 5 } }];
    for (const drag of drags) {
      expect(evaluateFigureCheck(f.checks[0]!, resolveFigure(f, drag)).passed).toBe(true);
    }
  });
});
