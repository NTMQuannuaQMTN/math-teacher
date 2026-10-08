# Geometry proof planner

Code: `shared/src/proof/` — `linear.ts` (algebra), `facts.ts` (fact types), `methods.ts` (library), `engine.ts`
(givens, search), `planner.ts` (problem → plan), `verify.ts` (independent verifier), `explain.ts` (lesson).
Tests: `worker/test/proofPlanner.test.ts`. Tools: `worker/scripts/proof-plan.ts` (all dataset geometry, `-v` for
proofs and the search log), `proof-heldout.ts`, `proof-lesson.ts <id>` (the lesson text), `method-library-doc.ts`.

## 1. Facts

A fact is structured data, never prose: `col` (collinear), `para`, `perp`, `cong` (equal segments), `eqangle`,
`aval` (angle value), `suppl`, `bisector`, `cyclic`, `prod` (Π segments = Π segments), `simtri`, `midp`. Each has a
canonical key (the same fact written two ways is one fact), Vietnamese text and LaTeX.

## 2. Algebra with provenance

Two linear systems hold everything that is "just algebra":

- **angles**: one variable per line, its direction mod 180°. Parallel, perpendicular, collinear, equal angles,
  angle values, supplementary angles, bisectors, inscribed angles of a cyclic quadrilateral and corresponding angles
  of similar triangles are linear equations. The angle sum of a triangle, vertical angles, linear pairs, alternate and
  corresponding angles all hold automatically, so one `ANGLE_CHASE` step covers the textbook's chain of angle
  equalities.
- **lengths**: one variable per segment (its logarithm). Equal segments, midpoints, products/ratios and the side
  ratios of similar triangles are linear.

Rows are kept reduced; each row carries the set of facts it came from. A query returns the facts it used, so every
algebraic step cites exactly its premises. An undirected angle ∠ABC is read with the orientation of A, B, C in the
figure, which is the configuration fact a textbook reads off the hypothesis.

## 3. Givens (the geometry graph)

From the statement figure's construction (`constructionFacts`): midpoints, points on segments (collinear), feet of
perpendiculars, intersections of lines (including perpendicular bisectors, tangents, parallels and bisectors given
by hidden helper points), circle membership (equal radii, concyclic sets), Thales circles, tangent ⊥ radius,
incenter bisectors, circumcenters, orthocenters. Shape words ("cân tại A", "vuông tại A", "hình bình hành") come from
`statementGivens`. Every given carries its reason ("E thuộc đường trung trực của DB").

## 4. Goals

`parseClaims` on each "chứng minh" part: equal segments and angles, angle values, ⊥, ∥, collinear, concyclic /
"tứ giác … nội tiếp", products such as ID² = IJ·IA, similar triangles (including "△X và △Y đồng dạng"), congruent
triangles (similar, plus one pair of equal sides), special quadrilaterals (sides parallel / equal / perpendicular),
chains "IB² = ID² = IA·IK" (each link), "đường tròn này đi qua O" (the same circle through one more point), and the
two auxiliary-point forms ("XY, ZW cắt nhau trên (O)", "XY đi qua trung điểm của ZW").

Anything else stated as a relation ("cắt nhau", "tiếp xúc", "cố định", "lớn nhất", …) and not understood is
**reported as not understood**. The problem is then at most `NEEDS_REVIEW`, never `VERIFIED`. A parsed claim that is
false on the exact figure means the parse or the figure is wrong; it is reported, never proved.

## 5. Search (`engine.ts`)

For each part of the problem, with only the points defined up to that part:

1. **backward**: every round each goal is tried directly by the methods that conclude its type (`goalMethods`):
   algebra, isosceles converse, cyclic quadrilateral (equal angles on one side / supplementary on opposite sides,
   power-of-a-point converse), similar triangles (AA, SAS), same line;
2. **forward rules**: isosceles base angles, midpoint halves, right triangles on a common hypotenuse (tangent
   lengths), power of a point for chords through a point, perpendicular bisector from two equidistant points;
3. **candidates from the oracle**: concyclic quadruples, equal segments, similar triangles (bucketed by angles) and
   collinear triples that are true on the figure and not known yet, most relevant to the goals first; each is tried
   with the methods above and kept only if a method proves it.

Bounds: depth 5 rounds, 4000 facts, 4 s, 1500 candidates per round. **Iterative deepening**: depth 1, 2, … and each
goal takes its proof from the shallowest successful search. Proof extraction keeps only what the goal depends on,
and premises of algebraic steps are minimised (drop the costliest premise if the step still follows).

**Observability**: `plan.log` has the givens count, per-round fact counts, time per phase, and every verifier
rejection; `plan.stats` has totals. `proof-plan.ts -v` prints all of it, plus each proof.

## 6. Verification (`verify.ts`)

Independent of the search (it doesn't use `search`, `tryProve` or the search's linear systems). Per step:

| Check | Rejects |
|---|---|
| method registered, allowed, grade ≤ 9, produces this fact type | unknown or outside-curriculum methods (inversion, trig laws, …) |
| premises are earlier steps | circular or forward references |
| a given is in the recomputed construction / statement givens | facts read off the diagram |
| rule shape (isosceles, perpendicular bisector, HL, cyclic quadrilateral, AA/SAS correspondence, power of a point, …) | a rule applied to the wrong objects, e.g. AA with a wrong vertex correspondence |
| algebraic steps re-solved from only the cited premises | angle chases that don't follow |
| configuration: equal angles on the same side / supplementary on opposite sides; power-of-a-point converse needs the point inside both chords or outside both | equal angles across a chord used for concyclicity |
| the fact holds on the figure and on perturbed copies | a fact true in this drawing only |

The test suite contains a valid proof and nine deliberately invalid ones (unknown method, outside-curriculum method,
an invented given, circular premise, a chase that doesn't follow, isosceles on the wrong angles, a false collinearity,
a wrong similarity correspondence, a missing goal); each is rejected for the stated reason.

**Limit:** when the statement's givens make the figure rigid in a way the perturbation can't keep (e.g. "cân tại A"
built from free points), no perturbed copy is valid. The numeric check then uses the original figure only; the
result reports `perturbations: 0`.

## 7. Explanation (`explain.ts`)

Deterministic templates, one per method, verbalise the verified steps only. Givens and one-line consequences of
givens are cited inline as reasons ("ID = IE (cùng là bán kính của (I))"); every other derivation is a step with its
display formula, its method's textbook name, `uses` links to earlier steps, and highlights of its points. Steps are
grouped by part. A hint per goal names the idea of its last step. Quadrilaterals are named in order around the circle.

`planReadability` decides whether the write-up can be shown as is: each stated step cites ≤ 8 facts and the proof fits
in 14 steps. Verified but long proofs (PTNK 2025 4c, Câu 4) are not shown as is; they go to the model as verified
results.

## 8. Known limits

- The figure builder must construct the statement exactly; 5 of 12 held-out problems failed there (chords meeting
  at a point, a tangent at the end of a diameter, a bisector meeting the circle, semicircles).
- Missing rules: tangent–chord angle, central angle = 2 × inscribed angle (needs a non-linear step), Ptolemy and
  everything in the advanced list, trigonometric or metric computations. Computation problems are not planned.
- Long chuyên proofs are correct but not textbook-like: an angle chase may cite 10+ facts. The explanation says which
  properties are used but not the order of the additions.
- Configuration is read from the statement figure. When the statement allows several configurations, the proof covers
  the one built.
