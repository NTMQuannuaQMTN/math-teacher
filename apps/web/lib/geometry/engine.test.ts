// Parity with the Python engine + drag behaviour. Run: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  compile,
  Degenerate,
  evaluate,
  type GeometrySpec,
  type PointValue,
  relationCircles,
  residuals,
  solveGivens,
  type Values,
} from "./engine.ts";

type Fixture = {
  spec: GeometrySpec;
  params: number[];
  values: Record<string, { type: string; x?: number; y?: number; c?: number[]; r?: number; p?: number[]; d?: number[] }>;
  goal_residuals: number[][];
  given_residuals: number[][];
};

const fixtures = JSON.parse(readFileSync(new URL("./fixtures.json", import.meta.url), "utf8")) as Fixture[];
const close = (a: number, b: number, tol = 1e-7) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("browser engine reproduces the Python engine", () => {
  assert.ok(fixtures.length >= 6);
  for (const fx of fixtures) {
    const values = evaluate(compile(fx.spec), fx.params);
    for (const [id, expected] of Object.entries(fx.values)) {
      const got = values[id]!;
      if (expected.type === "point") {
        const v = (got as PointValue).v;
        close(v[0], expected.x!);
        close(v[1], expected.y!);
      } else if (expected.type === "circle" && got.t === "circle") {
        close(got.c[0], expected.c![0]!);
        close(got.c[1], expected.c![1]!);
        close(got.r, expected.r!);
      } else if (expected.type === "line" && got.t === "line") {
        close(Math.abs(got.d[0] * expected.d![1]! - got.d[1] * expected.d![0]!), 0); // same direction
      }
    }
    fx.spec.goals?.forEach((goal, i) => residuals(goal, values).forEach((r, j) => close(r, fx.goal_residuals[i]![j]!)));
    fx.spec.givens?.forEach((g, i) => residuals(g, values).forEach((r, j) => close(r, fx.given_residuals[i]![j]!)));
  }
});

test("dragging a point keeps the givens (isosceles stays isosceles)", () => {
  const fx = fixtures.find((f) => f.spec.givens?.some((g) => g.kind === "angle_value"))!;
  const compiled = compile(fx.spec);
  const dragged = [...fx.params];
  dragged[0] = fx.params[0]! + 1.3; // move A
  dragged[1] = fx.params[1]! - 0.7;
  const solved = solveGivens(compiled, dragged, [0, 1]);
  assert.ok(solved, "a valid figure exists after the drag");
  assert.equal(solved[0], dragged[0]);
  assert.equal(solved[1], dragged[1]);
  const values = evaluate(compiled, solved);
  for (const g of fx.spec.givens ?? []) for (const r of residuals(g, values)) close(r, 0, 1e-7);
  for (const g of fx.spec.goals ?? []) for (const r of residuals(g, values)) close(r, 0, 1e-6);
});

test("intersection branch follows continuity, not ordering", () => {
  const fx = fixtures.find((f) => f.spec.objects.some((o) => o.id === "B" && o.kind === "intersection"))!;
  const compiled = compile(fx.spec);
  const first = evaluate(compiled, fx.params);
  const nudged = [...fx.params];
  nudged[2]! += 0.01; // move A slightly
  const next: Values = evaluate(compiled, nudged, first);
  const b0 = (first.B as PointValue).v, b1 = (next.B as PointValue).v;
  const c1 = (next.C as PointValue).v;
  assert.ok(Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) < Math.hypot(c1[0] - b0[0], c1[1] - b0[1]));
});

test("degenerate positions are reported with the culprit", () => {
  const compiled = compile({ objects: [{ kind: "free_point", id: "A" }, { kind: "line", id: "d", through: ["A", "A"] }] });
  assert.throws(() => evaluate(compiled, [1, 1]), (e: unknown) => e instanceof Degenerate && e.objectId === "d");
});

test("circles stated only as concyclic are drawn, unless a declared circle already passes through the points", () => {
  // BE, CF altitudes of triangle ABC: B, C, E, F lie on the circle with diameter BC.
  const spec: GeometrySpec = {
    objects: [
      { kind: "free_point", id: "A" }, { kind: "free_point", id: "B" }, { kind: "free_point", id: "C" },
      { kind: "line", id: "AB", through: ["A", "B"] }, { kind: "line", id: "AC", through: ["A", "C"] },
      { kind: "projection", id: "E", point: "B", line: "AC" }, { kind: "projection", id: "F", point: "C", line: "AB" },
    ],
    givens: [],
    goals: [{ kind: "concyclic", points: ["B", "C", "E", "F"] }],
  };
  const compiled = compile(spec);
  const params = [0.4, 3, -1, 0, 4, 0.2];
  const values = evaluate(compiled, params);
  assert.deepEqual(relationCircles(spec, values), [{ points: ["B", "C", "E"], goal: true }]);

  const withCircle: GeometrySpec = { ...spec, objects: [...spec.objects, { kind: "circle_diameter", id: "w", a: "B", b: "C" }] };
  assert.deepEqual(relationCircles(withCircle, evaluate(compile(withCircle), params)), []);
});
