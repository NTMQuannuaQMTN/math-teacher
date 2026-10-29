"use client";

// Interactive figure: free points are draggable; everything else is recomputed by lib/geometry/engine.ts after each
// move, the givens are re-solved with the dragged point held, and a degenerate position is refused (the figure snaps
// back) with the reason shown. JSXGraph only draws; the geometry lives in our engine.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  compile,
  Degenerate,
  evaluate,
  type GeoObject,
  type GeometrySpec,
  type LineValue,
  type PointValue,
  relationCircles,
  type CircleValue,
  type Relation,
  residuals,
  solveGivens,
  type Values,
  type Vec,
} from "@/lib/geometry/engine";

type Initial = { params?: number[] | null; values?: Record<string, unknown> | null };

const RELATION_LABELS: Record<string, (r: Relation) => string> = {
  perpendicular: (r) => `${(r.lines as string[][]).map((l) => l.join("")).join(" ⊥ ")}`,
  parallel: (r) => `${(r.lines as string[][]).map((l) => l.join("")).join(" ∥ ")}`,
  collinear: (r) => `${(r.points as string[]).join(", ")} thẳng hàng`,
  concyclic: (r) => `${(r.points as string[]).join(", ")} cùng thuộc một đường tròn`,
  equal_length: (r) => `${(r.segments as string[][]).map((s) => s.join("")).join(" = ")}`,
  equal_angle: (r) => `${(r.angles as string[][]).map((a) => `∠${a.join("")}`).join(" = ")}`,
  on_circle: (r) => `${r.point as string} thuộc đường tròn (${r.circle as string})`,
  on_line: (r) => `${r.point as string} thuộc ${r.line as string}`,
  tangent_line: (r) => `${(r.line as string[]).join("")} tiếp xúc (${r.circle as string})`,
  angle_value: (r) => `∠${(r.angle as string[]).join("")} = ${r.degrees as number}°`,
  length_value: (r) => `${(r.segment as string[]).join("")} = ${r.value as number}`,
  length_ratio: (r) => `${(r.segments as string[][]).map((s) => s.join("")).join(" : ")} = ${r.ratio as number}`,
};

function bounds(values: Values): [number, number, number, number] {
  const xs: number[] = [], ys: number[] = [];
  for (const v of Object.values(values)) {
    if (v.t === "point") { xs.push(v.v[0]); ys.push(v.v[1]); }
    if (v.t === "circle") { xs.push(v.c[0] - v.r, v.c[0] + v.r); ys.push(v.c[1] - v.r, v.c[1] + v.r); }
  }
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0, 1);
  const pad = span * 0.18;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = span / 2 + pad;
  return [cx - half, cy + half, cx + half, cy - half];
}

export function GeometryBoard({ spec, initial }: { spec: GeometrySpec; initial: Initial }) {
  const container = useRef<HTMLDivElement>(null);
  const compiled = useMemo(() => compile(spec), [spec]);
  const [warning, setWarning] = useState<string | null>(null);
  const [goalState, setGoalState] = useState<{ label: string; ok: boolean }[]>([]);
  const boardId = useMemo(() => `jxg-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let disposed = false;
    let board: { update: () => void; removeObject?: unknown } | null = null;
    let freeJxg: Record<string, { X: () => number; Y: () => number; moveTo: (c: number[]) => void }> = {};
    let params = [...(initial.params ?? [])];
    let values: Values = evaluate(compiled, params);
    let lastGood = { params: [...params], values };

    const goals = spec.goals ?? [];
    const refreshGoals = () => setGoalState(goals.map((g) => {
      let ok = false;
      try { ok = Math.max(...residuals(g, values).map(Math.abs)) < 1e-6; } catch { ok = false; }
      return { label: (RELATION_LABELS[g.kind] ?? (() => g.kind))(g), ok };
    }));

    void import("jsxgraph").then((mod) => {
      if (disposed || !container.current) return;
      const JXG = (mod as unknown as { default: { JSXGraph: { initBoard: (id: string, o: object) => unknown; freeBoard: (b: unknown) => void } } }).default;
      const b = JXG.JSXGraph.initBoard(boardId, {
        // No coordinate infobox: the figure is about relations, not coordinates.
        boundingbox: bounds(values), axis: false, showCopyright: false, showNavigation: false, showInfobox: false, keepAspectRatio: true,
        pan: { enabled: false }, zoom: { enabled: false },
      }) as {
        create: (type: string, parents: unknown[], attrs?: object) => { X: () => number; Y: () => number; moveTo: (c: number[]) => void; on: (e: string, f: () => void) => void };
        update: () => void;
      };
      board = b;
      const pt = (id: string): Vec => (values[id] as PointValue).v;
      const paramIndex = (id: string) => compiled.params.map((p, i) => (p.object === id ? i : -1)).filter((i) => i >= 0);
      const dependentStyle = { size: 2.5, fixed: true, strokeColor: "#1f2937", fillColor: "#1f2937", label: { fontSize: 14 }, showInfobox: false };
      const freeStyle = { size: 4, strokeColor: "#2f5bea", fillColor: "#2f5bea", label: { fontSize: 15 }, showInfobox: false };
      const circleStyle = { strokeColor: "#0f766e", strokeWidth: 1.6, fillOpacity: 0, highlight: false };

      const onDrag = (id: string) => () => {
        const handle = freeJxg[id]!;
        const obj = compiled.spec.objects.find((o) => o.id === id) as GeoObject;
        const next = [...params];
        const idx = paramIndex(id);
        if (obj.kind === "free_point") { next[idx[0]!] = handle.X(); next[idx[1]!] = handle.Y(); }
        else if (obj.kind === "point_on_circle") {
          const c = values[obj.circle as string] as CircleValue;
          next[idx[0]!] = Math.atan2(handle.Y() - c.c[1], handle.X() - c.c[0]);
        } else if (obj.kind === "point_on_line") {
          const line = values[obj.line as string] as LineValue;
          const x: Vec = [handle.X(), handle.Y()];
          if (line.a && line.b) {
            const span: Vec = [line.b[0] - line.a[0], line.b[1] - line.a[1]];
            let t = ((x[0] - line.a[0]) * span[0] + (x[1] - line.a[1]) * span[1]) / (span[0] ** 2 + span[1] ** 2);
            if (line.kind === "segment") t = Math.min(1, Math.max(0, t));
            if (line.kind === "ray") t = Math.max(0, t);
            next[idx[0]!] = t;
          } else {
            next[idx[0]!] = ((x[0] - line.p[0]) * line.d[0] + (x[1] - line.p[1]) * line.d[1]) / 4;
          }
        }
        try {
          const solved = solveGivens(compiled, next, idx);
          if (!solved) throw new Degenerate(id, "không giữ được các điều kiện của đề bài ở vị trí này");
          const recomputed = evaluate(compiled, solved, values);
          params = solved;
          values = recomputed;
          lastGood = { params: [...params], values };
          setWarning(null);
        } catch (err) {
          params = [...lastGood.params];
          values = lastGood.values;
          setWarning(err instanceof Degenerate ? `Hình suy biến (${err.objectId}): ${err.reason}` : "Không vẽ được ở vị trí này.");
        }
        // Every handle goes to its computed position: constrained points follow, glider points snap onto their
        // line/circle, and a refused move snaps back.
        for (const [fid, h] of Object.entries(freeJxg)) h.moveTo(pt(fid));
        refreshGoals();
        b.update();
      };

      // Points first (free = draggable), then lines and circles defined by functions of the current values.
      const jxgPoint: Record<string, unknown> = {};
      for (const o of compiled.order) {
        if (!["free_point", "point_on_line", "point_on_circle"].includes(o.kind)) continue;
        const v = pt(o.id);
        const handle = b.create("point", [v[0], v[1]], { ...freeStyle, name: o.id });
        handle.on("drag", onDrag(o.id));
        freeJxg[o.id] = handle;
        jxgPoint[o.id] = handle;
      }
      for (const o of compiled.order) {
        const value = values[o.id];
        if (!value) continue;
        if (value.t === "point" && !freeJxg[o.id]) {
          jxgPoint[o.id] = b.create("point", [() => pt(o.id)[0], () => pt(o.id)[1]], { ...dependentStyle, name: o.id });
        } else if (value.t === "line") {
          const ends = o.through as string[] | undefined;
          if (ends && ends.length === 2 && jxgPoint[ends[0]!] && jxgPoint[ends[1]!]) {
            const type = o.kind === "segment" ? "segment" : o.kind === "ray" ? "line" : "line";
            b.create(type, [jxgPoint[ends[0]!], jxgPoint[ends[1]!]], {
              strokeColor: "#475569", strokeWidth: 1.6, straightFirst: o.kind === "line", straightLast: o.kind !== "segment",
            });
          } else {
            const p0 = () => (values[o.id] as LineValue).p;
            const p1 = () => { const l = values[o.id] as LineValue; return [l.p[0] + l.d[0], l.p[1] + l.d[1]]; };
            b.create("line", [[() => p0()[0], () => p0()[1]], [() => p1()[0], () => p1()[1]]], {
              strokeColor: "#94a3b8", strokeWidth: 1.3, dash: 2,
            });
          }
        } else if (value.t === "circle") {
          b.create("circle", [[() => (values[o.id] as CircleValue).c[0], () => (values[o.id] as CircleValue).c[1]],
            () => (values[o.id] as CircleValue).r], { ...circleStyle });
        }
      }
      // Circles stated only as "concyclic" (e.g. "tứ giác BCEF nội tiếp"); a goal's circle is dashed.
      for (const c of relationCircles(spec, values)) {
        b.create("circumcircle", c.points.map((id) => jxgPoint[id]), {
          ...circleStyle, dash: c.goal ? 2 : 0, center: { visible: false },
        });
      }
      refreshGoals();
      b.update();
    });
    return () => {
      disposed = true;
      if (board) {
        void import("jsxgraph").then((mod) => {
          (mod as unknown as { default: { JSXGraph: { freeBoard: (b: unknown) => void } } }).default.JSXGraph.freeBoard(board);
        });
      }
      freeJxg = {};
    };
  }, [compiled, boardId]); // the board is rebuilt only when the figure changes

  return (
    <div>
      {/* JSXGraph manages the inner div's own ARIA attributes; the accessible name lives on the figure. */}
      <figure aria-label="Hình vẽ tương tác" className="m-0">
        <div id={boardId} ref={container}
          className="aspect-square w-full max-w-xl touch-none rounded-xl border border-line bg-white" />
      </figure>
      <p className="mt-2 text-xs text-muted">Kéo các điểm màu xanh để thay đổi hình; các điểm khác tự cập nhật theo đề bài.</p>
      {warning && <p role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{warning}</p>}
      {goalState.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm" aria-label="Điều cần chứng minh, kiểm tra trên hình">
          {goalState.map((g, i) => (
            <li key={i} className={g.ok ? "text-emerald-800" : "text-red-700"}>
              {g.ok ? "✓" : "✗"} {g.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
