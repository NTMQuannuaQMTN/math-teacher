# Mathematical knowledge map: Toán chuyên vào 10

Built from the 72 problems (79 sub-questions) of 7 real entrance papers (docs/EXAM_RESEARCH.md). Every
problem has a knowledge profile (`data/knowledge/profiles.jsonl`): prerequisite concepts, the main and
supporting techniques, the key insight, difficulty 1–5 and the expected level. Annotations are written by
Claude and **need a teacher's review**. The taxonomy (`data/techniques/taxonomy.json`) has 54 concepts with
prerequisite edges and 57 techniques.

A structured taxonomy plus a small graph index (`data/knowledge/graph.json`) is enough at this size; a graph
database would add nothing. Queries: `python3 tools/exams/query_knowledge.py …`.

## 1. What the papers demand

| | |
|---|---|
| Difficulty (1–5) | 1: 5 · 2: 16 · 3: 25 · 4: 14 · 5: 12 |
| Expected level | standard Grade 9: 9 · specialized (chuyên) Grade 9: 40 · olympiad-style: 23 |
| By topic | geometry 21 · algebra 21 · number theory 16 · combinatorics 10 · probability, statistics, word problem, applied optimisation 1 each |

**About a third of the problems (23 of 72) need an insight beyond the regular chuyên toolkit.** They are
mostly the last part of a geometry problem and the combinatorics or game question. A tutor has to
recognise these and teach the insight, not pretend it is routine.

## 2. Techniques that recur

| Technique | Problems | Where |
|---|---:|---|
| Angle chasing (biến đổi góc) | 13 | every geometry proof paper |
| Similar triangles (tam giác đồng dạng) | 10 | geometry proofs; product-of-segments identities |
| Factorise, then case split | 8 | number theory, systems |
| Case analysis | 8 | number theory, word problems |
| Parity / remainders (xét chẵn lẻ, số dư) | 7 | number theory, combinatorics |
| Construction (chỉ ra ví dụ) | 6 | extremal questions (attain the bound) |
| Completing the square | 6 | extremum, inequalities |
| Bounding (chặn) | 5 | number theory, combinatorics |
| Double counting | 4 | grids, acquaintance graphs |
| Contradiction | 4 | combinatorics, number theory |
| (p + q + r)² ≤ 3(p² + q² + r²) | 3 | symmetric inequalities |
| Subtract equations | 3 | symmetric systems, common roots |

Main technique by topic (query `stats`):
- **Geometry:** angle chasing (7), similar triangles (6), the orthocentre–diameter parallelogram (2).
- **Number theory:** periodicity mod n, case analysis, gcd decomposition (m = dx, n = dy), factorise-and-case.
- **Algebra:** substitute the constraint, sum-of-squares bounds, subtract equations, symmetric sums.
- **Combinatorics:** double counting, sweep strategies, extremal choice.

## 3. Prerequisite structure (excerpt)

```
alg.identities ─► alg.factorization ─► alg.rational_expressions
alg.discriminant ─► alg.vieta ─► alg.recurrence (αⁿ + βⁿ)
alg.square_sum_nonneg ─► alg.am_gm
nt.divisibility ─► nt.modular_arithmetic ─► nt.quadratic_forms (a² + 7b²)
nt.divisibility ─► nt.gcd ─► nt.rationals_fractions
geo.cyclic_quad ─► geo.tangent_properties ─► geo.incircle_tangents
geo.similar_triangles + geo.cyclic_quad ─► geo.power_of_point
comb.counting ─► comb.double_counting ;  comb.pigeonhole ─► comb.graph_coloring
```

Example queries:
- `prereqs tech.power_of_point` → needs geo.cyclic_quad and geo.similar_triangles first.
- `technique-frequency geometry prove` → angle chasing 13, similar triangles 10, then a long tail of one-off
  constructions (reflection, isosceles trapezoid, known lemma).
- `gaps alg.vieta` → 10 of 72 problems are out of reach for a student who doesn't know Vi-ét.
- `problems-with geo.power_of_point` → 5 problems: PTNK 2024 B4a–d and PTNK 2026 Câu 4 (the incircle problem).

## 4. Implications for the solver

1. **Method selection is learnable from cues.** The main technique usually follows from surface cues: a
   cyclic system, "nghiệm chung", "chia hết", "bảng ô vuông", a diameter together with an orthocentre.
   That is the basis of the method cards (`worker/src/solver/techniques.ts`, 18 cards): a deterministic cue
   match, no extra model call. They are evaluated in docs/CURRENT_SOLVER_EVALUATION.md.
2. **The olympiad-style third is where models fail** (the long geometry proofs ch-4 and PTNK 2023 B5d;
   the games). Retrieval can name the tool, but the insight needs a stronger model or a worked example.
3. **Verification differs by type.** Algebra and number theory answers can be checked by computation.
   Proofs need figure measurement (geometry) or nothing (games, extremal combinatorics), so the app must
   say "not checked" honestly for those.
4. **Common errors recorded:**
   - answering 12 instead of 11 (PTNK 2023 B3b);
   - forgetting the case where the truck has already passed the junction (TP.HCM B2a);
   - missing the domain x ≥ 0 or the shared root x = 1 (PTNK 2024 B1.2);
   - roots that only touch zero (KHTN I.1).
   These belong in hints, as "watch out for…".
