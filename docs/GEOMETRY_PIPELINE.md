# Geometry pipeline

Problem → initial figure → solution-driven constructions → every mentioned object drawn → step ↔ object sync.

## 1. The model draws last

The figure is the **last** field of the schema, so the model writes it after the hints, steps and answer checks,
and the prompt asks it to include every point, segment, angle and circle the problem and solution mention.
Points are given as constructions (`free`, `midpoint`, `foot`, `intersection`, `line_circle`, `circle_circle`,
`incenter`, `circumcenter`, …) and resolved to coordinates by [shared/src/geometry.ts](../shared/src/geometry.ts) —
never as raw coordinates.

## 1b. The statement builds the figure (2026-10-07)

`figureFromStatement` ([shared/src/figureFromText.ts](../shared/src/figureFromText.ts)) constructs the figure from the
student's confirmed problem text, with no model involved:

1. **Base shape** placed so the stated properties hold with a margin: a triangle ("nhọn", "vuông tại", "cân tại",
   "đều", "AB < AC", "Â > B̂ > Ĉ", given angles "góc A bằng 40 độ" / "∠A = 40°", given sides), inscribed in "(O)"
   when said; a cyclic quadrilateral (with "AC đi qua tâm O"); a parallelogram/rectangle/square/rhombus; a circle with
   tangents from an outside point; a circle with a chord.
2. **Every other point from its definition**, in order ([pointDefinitions.ts](../shared/src/pointDefinitions.ts)):
   midpoints, feet, intersections ("K = AD ∩ EF" too), incircle contact points, altitudes and the orthocentre,
   perpendicular bisectors, "kẻ ND vuông góc với BC tại D", rays and lines meeting a circle, diameters, tangent lines and
   their intersection, the foot of an external bisector, a tangent point other than a named one, circles named by
   their center or through three points, lists "lần lượt / theo thứ tự / tương ứng là …", points on an arc chosen so the
   stated inequalities ("CD > AB") hold.
3. **Adopted only if trustworthy**: nothing named is left unbuilt, the givens and stated inequalities hold, no
   "chứng minh" claim measured on it is false, and the model's own givens hold on it. Then statement points come from
   the statement (the model's placement is discarded) and the model's auxiliary points, lines, angles and checks are
   kept on top; a model circle with the same center keeps its id so highlights still work.

On the 20 distinct geometry statements in our datasets (`npx tsx scripts/statement-figures.ts`): a base shape for 18,
every named point built for 16, givens failing 0, measured claims true 15 / false 0. Not covered: a tangent chosen by
a condition (khtn III.1), two crossing segments as the base (kc-mcq3), quadrilaterals defined only by angles or
diagonals (kc-mcq9, ch-2).

## 2. Deterministic repairs ([shared/src/verify.ts](../shared/src/verify.ts) `verifyLesson`)

In order:

1. `constructNamedPoints` — points the text defines exactly ("I là tâm đường tròn nội tiếp", "M là trung điểm BC")
   are rebuilt from that definition, overriding the model's construction (`force` for incenter/circumcenter).
2. `regularizeTriangle` — a free triangle that is nearly isosceles/degenerate is reshaped so later constructions
   don't collapse.
3. `defineReferencedObjects` — ids that hints/steps highlight (`seg_IK`, `ang_IHD`) but the figure lacks are defined.
4. Structure check, then `resolveFigure`; objects that can't be constructed are left out with what depends on them.
5. Givens are measured on the figure (model checks plus facts implied by "vuông tại A", "cân", "đều"); a figure
   that contradicts the givens is dropped (the text lesson is still served).
6. Derived claims in the solution ("IH ⊥ IK", "AB = AC", "∠ABH = ∠ACB") are measured on the exact figure; a false
   claim un-verifies the lesson and sends it back with feedback.
7. `completeFigure` ([shared/src/figureComplete.ts](../shared/src/figureComplete.ts)):
   - adds every mentioned segment that isn't drawn (problem segments from the start; solution segments as
     construction lines revealed by the first step that uses them);
   - **NEW:** adds an arc for every mentioned angle whose three points are drawn (not for straight angles);
   - **NEW:** each step's highlight gets every segment, angle and named circle the step (and its hints) talks
     about, merged after the model's own targets (≤ 10 per step);
   - reports named points and circles that are missing — these cannot be invented and go back to the model.

## 3. Stable ids and synchronization

Every drawable has a stable id (`seg_AB`, `ang_ABC`, circle ids, point ids). `buildTargetIndex` maps loose names
("AB", "∠ABC", "ABC") to those ids. In the app ([mobile/src/components/lesson/LessonView.tsx](../mobile/src/components/lesson/LessonView.tsx)):

- step/hint → objects: selecting a step highlights its `geometryActions` targets and dims the rest;
  construction lines appear from the step that `show`s them;
- **NEW** object → step: tapping a point, segment or angle focuses the first step that draws or highlights it
  and scrolls to it (only when the solution is open; otherwise a revealed hint that focuses it — nothing locked
  is revealed).

## 4. Completeness measure

`figureCoverage(lesson, resolved)` reports, without changing anything: segments and angles mentioned vs drawn,
missing points/circles, and steps whose highlight covers everything they name. `worker/scripts/figure-coverage.ts`
runs it on every stored lesson (see EVALUATION_REPORT.md).

## Limits

- "Mentioned" is detected by patterns (`AB`, `\widehat{ABC}`, `∠ABC`, `tam giác ABC`, `(O)`). A single-letter
  angle (`\widehat{A}`) or an object described only in words ("đường cao từ đỉnh A") is not detected.
- A point the model never constructed cannot be added; it is reported and the lesson is retried once.
- Schematic figures (no fixed shape) are not used to measure derived claims.
