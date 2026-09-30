# AI solver: current state (2026-09-30)

This describes the system as it is on branch `sprint/model-research` at the start of the cost/accuracy
sprint. Measured numbers come from this repo's logs and benchmark files. When a number is only an
estimate, the text says so.

## 1. Architecture

```
Expo app (iOS/Android/web)                       Cloudflare Worker (TypeScript)
┌────────────────────────────┐   HTTPS JSON     ┌──────────────────────────────────────────────┐
│ camera / photo picker       │ ──────────────▶ │ POST /v1/scans      → OCR provider            │
│ check screen (edit/split)   │                  │ POST /v1/scans/:id/confirm (questions)       │
│ lesson screen: hints, steps │ ◀────────────── │ POST /v1/scans/:id/solve?q=qN → solver       │
│ GeometryView (SVG, drag)    │                  │ D1 (SQLite): scans, solutions, rate_limits   │
└────────────────────────────┘                  │ R2: photos (signed URLs)                     │
                                                 └──────────────────────────────────────────────┘
shared/ (TypeScript, used by both): API contract (zod), lesson schema, geometry engine,
figure scene builder, expression evaluator, verifier, claim checker, point-definition parser.
```

### Data flow of one solve

1. **OCR** (`worker/src/ocr/`): photo → `{ problems: [{label, text}] }` with `$…$` LaTeX. The provider
   is configurable: Gemini (default `gemini-3.1-flash-lite`), OpenAI, Anthropic or mock. A fallback
   provider can be set. The student edits or splits the text on the check screen.
2. **Solve** (`worker/src/routes/solve.ts` → `worker/src/solver/pipeline.ts`):
   1. The shared lesson library is checked first: the same problem (normalised text + prompt version)
      that was already verified is served with no AI call.
   2. Routing (`routing.ts`): a keyword check `looksLikeGeometry` chooses the prompt (with or without
      the ~1.1K-token geometry section) and the model (`SOLVER_MODEL`, `SOLVER_GEOMETRY_MODEL`,
      `SOLVER_FALLBACK_MODEL`).
   3. **One structured-output LLM call** produces the whole lesson: analysis, strategy, hints, steps,
      final answer, answer checks and figure (`ModelLessonSchema`, ~70 fields, strict JSON schema).
      The figure is the last field, so it is written after the solution.
   4. **Deterministic repair and verification** (`shared/src/verify.ts`), described in section 3.
   5. If verification reports problems, the pipeline retries once. The retry uses the stronger
      fallback model with the problems as feedback. The best attempt is kept, and a failed retry
      never discards an earlier lesson.
   6. The result is stored in D1 with its verification status: verified / partial / unverified /
      not_checkable.
3. **Render** (`mobile/src/components/lesson`, `geometry/GeometryView.tsx`): hints are revealed one at
   a time, steps highlight figure objects, and the figure is interactive. Dragging preserves the
   givens through a least-squares constraint solver in `shared/src/constraints.ts`.

## 2. Model/API dependencies and configuration

| Stage | Default model | Settings (wrangler.toml / .dev.vars) | Secret |
|---|---|---|---|
| OCR | `gemini-3.1-flash-lite` | `OCR_PROVIDER`, `GEMINI_OCR_MODEL`, `OCR_FALLBACK_PROVIDER` | `GEMINI_API_KEY` |
| Solve, first attempt | `gemini-3.5-flash-lite` (low thinking; geometry uses medium) | `SOLVER_MODEL`, `SOLVER_GEOMETRY_MODEL`, `*_REASONING_EFFORT` | `GEMINI_API_KEY` |
| Solve, retry | `gemini-3.5-flash` (medium thinking) | `SOLVER_FALLBACK_MODEL` | `GEMINI_API_KEY` |
| Alternatives | OpenAI (`SOLVER_PROVIDER=openai`), mock (development only) | | `OPENAI_API_KEY` |

- Secrets live only in `worker/.dev.vars` (gitignored) and Cloudflare secrets. None are in the repo.
- **As of this sprint Gemini is disabled and no paid API may be called.** `SOLVER_PROVIDER=off` pauses
  solving, and stored lessons are still served.

## 3. Verification (what already exists)

All of it is deterministic, with no LLM judge:

- **Structure:** every id that hints, steps and the figure reference must exist. Malformed ids are
  cleaned, malformed figure checks are repaired or dropped, and double-escaped LaTeX and bare LaTeX
  are repaired.
- **Answer checks** (`runAnswerCheck`), written by the model and executed by the evaluator
  (`shared/src/expr.ts`):
  - `substitute` (plug the solutions into the original equations);
  - `identity` (random-point testing of algebraic identities);
  - `inequality` (sampling the real line);
  - `value` (arithmetic);
  - `integers` (brute force over −200…200 for "find all n"; a failure reports the true set).
  - Checks that only restate the answer are rejected. Each lettered part asking for a result needs its
    own passing check.
- **Figure:** points are built from their textual definitions ("Gọi M là trung điểm BC", "giao điểm
  khác I của IK với đường tròn đường kính AI", …; `pointDefinitions.ts`). Given conditions are
  checked on the exact construction, and inequalities in the statement ("AB < AC") must hold with a
  clear margin. Every segment the text mentions is drawn.
- **Claims** (`claims.ts`): ⊥, ∥, equal segments, products and ratios of segments, equal angles,
  collinear, concyclic, "nội tiếp" and similar triangles, parsed from the statement, hints and steps
  and measured on the figure. A false claim marks the lesson unverified and is sent back to the
  model. Each "Chứng minh" part needs a measured, passing claim.

## 4. Costs

| Item | Measured |
|---|---|
| OCR, one photo | ≈ $0.0008 (`gemini-3.1-flash-lite`, ~2K in / ~200 out) |
| Easy algebra lesson | ≈ $0.004 (flash-lite, ~2K in / ~1.2K out) |
| Standard geometry lesson | ≈ $0.01–0.05 (flash-lite → flash when a check fails) |
| Hard 3-part proof (Toán chuyên Câu 4) | **$0.32** (`gemini-3.5-flash`, 128 s, thinking-heavy) |
| Development spend so far | ≈ SGD 3 (reported by the user); most of it came from repeated eval runs during development, not production |

The cost is dominated by (a) retries and escalation to the stronger model on hard problems, and
(b) re-running the same evaluation problems during development. The response cache in
`worker/scripts/lib/modelCache.ts` removes (b).

## 5. Known accuracy problems (observed, with evidence)

| Problem | Evidence | Status |
|---|---|---|
| Wrong answers labelled "verified" | f(n) = (n+4)⁴ − n⁴ parts b and c; only part a was checked | Fixed: `integers` check, one check per part |
| Wrong constants | r + s = 3 instead of −3/2 (common-root problem) | Caught when a check exists; fixed by the stronger-model retry |
| False proof steps | "IH ⊥ IK", "∠IDK = ∠IAD", "J trùng K" (incircle problem) | Caught by the claim checker |
| Points in the problem/solution missing from the figure | H, K, L, G, (S) missing | Fixed by building points from their definitions |
| Degenerate figures (nearly isosceles when AB < AC) | circle (S) with radius 19 | Margin check and view fitting |
| Hand-waving steps ("ta chứng minh được…") | incircle part c | Prompt rule only; not detectable deterministically |

## 6. Keep vs redesign

**Keep, since they work and are cheap:** the OCR flow and check screen, the lesson schema and
renderer, the geometry construction engine, constraint dragging, the verifier, claim checker and
point parser, the shared lesson library, and the D1/R2 storage.

**Redesign candidates** (evaluated in `EXPERIMENT_LOG.md` / `MODEL_DECISION.md`):

- **"One LLM call does everything".** The same call solves, teaches and draws, so a weak model gets
  all three wrong together. Candidates: separating solving from teaching, local or open models for
  the first attempt, and deterministic solvers for the categories where they apply.
- **Model routing.** It is keyword-based today and has no notion of difficulty.
- **Development evaluation.** It had no cache and no fixed dataset. Both now exist in `tools/benchmark/`.
