import { describe, expect, it } from "vitest";
import { constrainedDrag } from "../../shared/src/constraints";
import { dist, evaluateFigureCheck, resolveFigure, type Override } from "../../shared/src/geometry";
import type { Figure, FigureCheck, PointDef } from "../../shared/src/solution";

const P = (id: string, kind: PointDef["kind"], extra: Partial<PointDef> = {}): PointDef => ({
  id, label: id, kind, refs: [], x: null, y: null, value: null, value2: null, draggable: false, hidden: false, ...extra,
});
const given = (kind: FigureCheck["kind"], refs: string[], value: number | null = null): FigureCheck => ({ kind, refs, value, role: "given" });
const base = (points: PointDef[], checks: FigureCheck[]): Figure => ({
  scale: "schematic", points, lines: [], circles: [], angles: [], marks: [], checks,
});
const holds = (figure: Figure, o: Record<string, Override>) => {
  const r = resolveFigure(figure, o);
  return figure.checks.filter((c) => c.role === "given").every((c) => evaluateFigureCheck(c, r).passed);
};

describe("constraint-preserving drag", () => {
  // Right triangle ABC (right angle at A), all three vertices free, given AB ⊥ AC.
  const right = base(
    [P("A", "free", { x: 0, y: 0 }), P("B", "free", { x: 4, y: 0 }), P("C", "free", { x: 0, y: 3 }), P("M", "midpoint", { refs: ["B", "C"] })],
    [given("perpendicular", ["A", "B", "A", "C"])],
  );

  it("keeps a right angle when a vertex is dragged", () => {
    for (const [id, to] of [["B", { x: 5, y: 2 }], ["A", { x: 1, y: -1 }], ["C", { x: -2, y: 4 }]] as const) {
      const next = constrainedDrag(right, {}, id, to);
      expect(next, id).not.toBeNull();
      const r = resolveFigure(right, next!);
      expect(dist(r.points[id]!, to)).toBeLessThan(1e-9); // the dragged point is exactly where it was put
      expect(holds(right, next!)).toBe(true);
    }
  });

  it("moves the other points as little as needed", () => {
    const next = constrainedDrag(right, {}, "B", { x: 4, y: 0.4 })!;
    const r = resolveFigure(right, next);
    expect(dist(r.points.A!, { x: 0, y: 0 }) + dist(r.points.C!, { x: 0, y: 3 })).toBeLessThan(0.5);
  });

  it("keeps working over a long drag (each move starts from the last)", () => {
    let o: Record<string, Override> = {};
    for (let k = 1; k <= 30; k++) {
      const next = constrainedDrag(right, o, "B", { x: 4 + k * 0.1, y: k * 0.15 });
      expect(next).not.toBeNull();
      o = next!;
    }
    expect(holds(right, o)).toBe(true);
  });

  it("keeps an isosceles triangle isosceles, and several givens at once", () => {
    const iso = base(
      [P("A", "free", { x: 0, y: 4 }), P("B", "free", { x: -3, y: 0 }), P("C", "free", { x: 3, y: 0 }), P("D", "free", { x: 0, y: 0 })],
      [given("equal_length", ["A", "B", "A", "C"]), given("collinear", ["B", "D", "C"]), given("perpendicular", ["A", "D", "B", "C"])],
    );
    const next = constrainedDrag(iso, {}, "A", { x: 1, y: 5 });
    expect(next).not.toBeNull();
    expect(holds(iso, next!)).toBe(true);
  });

  it("keeps a point on a circle and a fixed length", () => {
    const fig: Figure = {
      ...base(
        [P("O", "free", { x: 0, y: 0 }), P("A", "free", { x: 2, y: 0 }), P("B", "free", { x: 0, y: 2 }), P("C", "free", { x: 5, y: 5 })],
        [given("on_circle", ["B", "c"]), given("length_value", ["A", "C"], Math.hypot(3, 5))],
      ),
      circles: [{ id: "c", center: "O", through: "A", radius: null, style: "given", label: null }],
    };
    const next = constrainedDrag(fig, {}, "A", { x: 3, y: 0 });
    expect(next).not.toBeNull();
    expect(holds(fig, next!)).toBe(true);
  });

  it("doesn't try to enforce a given the figure didn't satisfy to begin with", () => {
    const schematic = base([P("A", "free", { x: 0, y: 0 }), P("B", "free", { x: 4, y: 0 })], [given("length_value", ["A", "B"], 10)]);
    const next = constrainedDrag(schematic, {}, "B", { x: 5, y: 1 })!;
    expect(resolveFigure(schematic, next).points.A).toEqual({ x: 0, y: 0 });
    expect(resolveFigure(schematic, next).points.B).toEqual({ x: 5, y: 1 });
  });

  it("refuses a move that can't keep the givens", () => {
    // D slides along BC but the problem says D is the midpoint: no position other than the middle works.
    const fig = base(
      [P("B", "free", { x: 0, y: 0 }), P("C", "free", { x: 4, y: 0 }), P("D", "on_segment", { refs: ["B", "C"], value: 0.5 })],
      [given("equal_length", ["B", "D", "D", "C"])],
    );
    expect(constrainedDrag(fig, {}, "D", { x: 1.2, y: 0 })).toBeNull();
  });
});

describe("angles marked in the drawing stay true while dragging", () => {
  it("keeps a right-angle mark at 90° and a 40° label at 40°, even without checks", () => {
    const e = { x: 6 + 3 * Math.cos((40 * Math.PI) / 180), y: 3 * Math.sin((40 * Math.PI) / 180) };
    const fig: Figure = {
      ...base(
        [
          P("A", "free", { x: 0, y: 0 }), P("B", "free", { x: 4, y: 0 }), P("C", "free", { x: 0, y: 3 }),
          P("D", "free", { x: 6, y: 0 }), P("E", "free", e), P("F", "free", { x: 9, y: 0 }),
        ],
        [],
      ),
      angles: [
        { id: "ang_BAC", from: "B", vertex: "A", to: "C", label: null, right: true, style: "given" },
        { id: "ang_FDE", from: "F", vertex: "D", to: "E", label: "40°", right: false, style: "given" },
      ],
    };
    let o = constrainedDrag(fig, {}, "C", { x: 1, y: 4 });
    expect(o).not.toBeNull();
    o = constrainedDrag(fig, o!, "E", { x: 8, y: 3 });
    expect(o).not.toBeNull();
    const r = resolveFigure(fig, o!);
    const ang = (a: string, v: string, b: string) => {
      const [p, q, w] = [r.points[a]!, r.points[v]!, r.points[b]!];
      const u = { x: p.x - q.x, y: p.y - q.y };
      const z = { x: w.x - q.x, y: w.y - q.y };
      return (Math.acos((u.x * z.x + u.y * z.y) / (Math.hypot(u.x, u.y) * Math.hypot(z.x, z.y))) * 180) / Math.PI;
    };
    expect(ang("B", "A", "C")).toBeCloseTo(90, 1);
    expect(ang("F", "D", "E")).toBeCloseTo(40, 1);
  });
});
