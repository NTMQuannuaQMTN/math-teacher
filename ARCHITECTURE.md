# Architecture

## Scope

- **Milestone 1 (implemented):** Image → OCR → Edit/Verify → Save.
- **Milestone 2 (implemented, "Solver V1"):**
  - confirmed problem → understanding → Grade-9-appropriate solution
  - → hint-first lesson → interactive geometry synchronized with the steps.
  - The design is described in *Solver V1* below.
- **Not built:** student attempts, knowledge tracking, adaptive curriculum, dashboards.

## Overview

```
┌──────────────────────────┐   HTTPS (Bearer device token)   ┌──────────────────────────────┐
│  mobile/  Expo (RN, TS)  │ ──────────────────────────────▶ │  worker/  Cloudflare Worker  │
│  expo-router screens     │                                 │  validation · auth · limits  │
│  camera · crop · edit    │ ◀── JSON validated by shared/ ──│  OCR orchestration           │
│  KaTeX preview           │                                 └──────┬───────────┬──────────┘
└──────────────────────────┘                                        │           │
             ▲                                                      ▼           ▼
             │ signed, expiring image URLs                     D1 (scans)   R2 (images, private)
             └──────────────────────────────────────────────────────────────────┘
                                                                    │
                                                                    ▼
                                                   OcrProvider: openai | anthropic | mock
```

`shared/` holds the API contract (Zod schemas + types) and the maths-text utilities. Both the
Worker and the app import it, so the contract can't drift. The app validates every response
against it.

## Why this shape

The previous implementation (in git history) already used Expo + Worker + D1 + R2, and that
stack fits the brief. What changed:

- **Rebuilt around OCR.** The old single `POST /api/questions` ran extract → classify → diagram →
  solve in one call and all the UI lived in one `App.tsx`. Now scan creation, OCR retry, and
  confirmation are separate endpoints, and the app has one screen per step.
- **Ownership.** Previously anyone holding a question id could read it. Now every row has an
  `owner_id`, and every query filters on it.
- **Fixed worker config.** The worker no longer depends on `expo`, and its tsconfig no longer
  extends Expo's.

## Request flow

1. **Capture.** In-app camera (`expo-camera`) with a framing guide. The photo is auto-cropped to
   the guide, or the student picks an image from the library (`expo-image-picker`).
2. **Review / crop.** A draggable crop box; the image is re-encoded to JPEG, long side ≤ 1280 px.
3. **Upload.** `POST /v1/scans` (multipart) with an `Idempotency-Key` that stays stable across
   retries of the same image.
4. **Worker.**
   - Checks auth and per-device/per-IP rate limits.
   - Sniffs the file type from its bytes and reads its dimensions.
   - Stores the image in R2 and inserts a D1 draft row that holds the OCR lock.
   - Runs OCR under a hard timeout, validates and sanitizes the output, and stores the result.
   - OCR runs inside `ctx.waitUntil`, so the result is saved even if the student leaves the screen.
5. **Result.** The app renders the formatted text with KaTeX. The student can edit it (with a
   symbol toolbar and live preview), retry OCR, or retake the photo.
6. **Confirm.** `POST /v1/scans/:id/confirm` stores the verified text; the draft becomes
   `confirmed`.
7. **History.** `GET /v1/scans?status=confirmed` uses keyset pagination and returns signed image
   URLs.

## API (v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/v1/scans` | upload an image and run OCR; returns 201 with the scan (OCR failure → `ocrError`, scan kept) |
| POST | `/v1/scans/:id/ocr` | re-run OCR on the stored image (drafts only) |
| POST | `/v1/scans/:id/confirm` | save the student-verified text `{ text }` |
| GET | `/v1/scans?status=confirmed\|draft&limit&cursor` | history, or unfinished drafts from the last 24 h |
| GET | `/v1/scans/:id` | one scan |
| DELETE | `/v1/scans/:id` | delete the scan and its image |
| GET | `/v1/images/:id?exp&sig` | private image via signed URL (no auth header needed) |

Errors are always `{ error: { code, message, retryable } }`. `code` is a closed enum
(`ErrorCodeSchema`), and the app maps each code to its own localized copy.

## OCR pipeline

- **Interface.** `OcrProvider.extract(image) → { text, model }` (`worker/src/ocr/provider.ts`).
  Providers only fetch; they never interpret the output.
- **Providers.**
  - `openai`: Chat Completions with a strict `json_schema`.
  - `anthropic`: official SDK with `output_config.format` JSON schema, `effort: low`, and
    server-side refusal fallback.
  - `mock`: canned fixtures. Development only; responses are labelled `provider: "mock"` and the
    app shows a "Demo OCR" badge.
- **Normalization** (`worker/src/ocr/normalize.ts`) is the single trust boundary for model
  output. It:
  - parses the JSON tolerantly (fences, surrounding prose) and validates it strictly (unknown
    keys rejected);
  - NFC-normalizes text (Vietnamese diacritics), strips control characters, and caps lengths;
  - falls back to escaped plain text if the maths markup is malformed;
  - rejects degenerate, looping output;
  - derives `low_quality` from self-reported confidence and issues;
  - corrects the language label from Vietnamese-only letters.
- **Retry.** One automatic retry on malformed output; the student can retry manually after that.
- **Confidence** is `{ level, source: "model_self_report" }`. It is labelled as uncalibrated and
  never shown as a percentage.

### OcrResult

```ts
{
  status: "success" | "low_quality" | "no_math_found" | "unreadable";
  rawText: string;        // Unicode maths (x², √, ≤), no LaTeX
  formattedText: string;  // prose + $inline$ / $$display$$ LaTeX
  language: "vi" | "en" | "mixed" | "unknown";
  confidence: { level: "high" | "medium" | "low"; source: "model_self_report" } | null;
  issues: ("blurry" | "cut_off" | "multiple_problems" | "handwriting_uncertain"
           | "low_resolution" | "glare_or_shadow" | "rotated")[];
  provider: string;
  model: string;
  durationMs: number;
}
```

## Data

**D1 `scans`** (see `worker/migrations/0001_scans.sql`):

- identity and flow: `id`, `owner_id`, `idempotency_key`, `status` (draft/confirmed), `source`
- image: `image_key`, content type, bytes, width, height
- OCR: `ocr_json` (the validated OcrResult), `ocr_error_code`, `ocr_attempts`, `ocr_started_at`
  (the lock)
- confirmed problem: `problem_text`, `problem_edited`
- timestamps: `created_at`, `updated_at`, `confirmed_at`

OCR is stored as JSON so its shape can evolve without migrations. The confirmed problem gets real
columns because later milestones will query it.

**D1 `rate_limits`** holds fixed-window counters, updated with an atomic upsert.

**R2** stores images at `scans/<owner prefix>/<scan id>`. The bucket is private and is read only
through signed URLs.

**Retention.** A daily cron deletes drafts older than `DRAFT_RETENTION_DAYS` (default 7), together
with their images. Confirmed problems are kept.

## Security

- **AI keys** exist only as Worker secrets. The app bundle contains only the API URL.
- **Device auth.** A 256-bit random token lives in the device's secure store (Keychain/Keystore).
  The server stores only `sha256(token)` as `owner_id`, and every query is scoped by it.
  - *Trade-off:* this gives isolation, not identity; anyone can mint a token, so abuse is bounded
    by per-IP limits.
  - Real accounts can later adopt an `owner_id` without migrating data.
- **Uploads.**
  - Size is checked from Content-Length before reading the body, then again on the actual bytes.
  - The file type comes from its magic bytes, never from the client's MIME type or file name.
  - Dimensions are read from the header; tiny images and decompression bombs are rejected.
- **SQL.** Every query is a prepared statement with bound parameters.
- **Prompt injection.**
  - The system prompt is fixed and never contains user- or image-derived text.
  - The image is framed as untrusted data to transcribe, not to obey.
  - Output is schema-constrained; extra keys are rejected, and the text is rendered as data.
- **Rendering.**
  - Maths is rendered by KaTeX with `trust: false`.
  - Prose is inserted with `textContent`, never `innerHTML`.
  - The WebView blocks all navigation.
- **Errors.** Clients get a closed set of codes and generic messages; details go only to the logs.
- **Abuse.** OCR calls are limited per device and per IP per hour. Duplicate submissions are
  handled by idempotency keys and an atomic OCR lock.
- **Images** are served with `nosniff`, a restrictive CSP, and `private` caching. Signed URLs
  expire.

## Multi-question photos

- **OCR.** It returns `problems: [{ label, text }]` next to the full text. Each numbered exercise is
  one problem; sub-parts a), b) and shared context stay with their exercise, and page headers are
  dropped. Each problem is validated like the full text. If the model returns none, the whole text
  becomes one problem.
- **Check screen.** When there is more than one problem, it shows a card per problem with
  keep/skip and its own editor (`ProblemEditor`). Saving sends
  `confirm { questions: [...] }`.
- **Storage.** `scans.questions_json` holds `[{ id: "q1", label, text }, …]`, and
  `problem_text` is all questions joined. Scans confirmed earlier count as a single `q1`.
- **Lessons** are keyed by (`scan_id`, `question_id`), and `/v1/scans/:id/questions/:qid/solve`
  solves one question. Solve prefetch on save only runs for single-question photos; with several,
  the student chooses.

## Solver V1 (milestone 2)

```
confirmed problem text ──▶ POST /v1/scans/:id/solve
                              │  auth · rate limit · cache check (problem hash + prompt version) · lock
                              ▼
                    ONE structured-output model call: geometry → gpt-5.5; everything else → gpt-5.4-mini (low),
                    retrying on gpt-5.5 only when the checks fail (worker/src/solver/routing.ts)
                    system prompt = curriculum + teaching + hints + geometry + verification rules
                              │  JSON (strict schema)
                              ▼
                    zod validation (ModelLessonSchema, strict: extra fields rejected)
                              ▼
                    deterministic verification (shared/, no AI)
                     ├─ structure: ids, hint→step links, figure references (aliases repaired)
                     ├─ figure: construct it, check given conditions, measure derived claims
                     └─ answer: substitute / identity sampling / inequality sampling / values
                              │ problems? ──▶ ONE corrective retry with the exact problems
                              ▼
                    stored in D1 `solutions` (status ready | failed) ──▶ app renders data
```

### Why one call

- A single call returns the whole lesson: understanding, plan, hints, steps, figure, and
  machine-checkable claims. It usually takes 10–25 s; hard geometry can take up to about 50 s.
- Separate calls per stage would multiply latency and cost, and could let the stages drift out of
  sync (hints that don't match the steps).
- The *stages* still exist as sections of the prompt and fields of the schema, so they can be
  split into separate calls later without changing the API.

### Contracts (`shared/src/solution.ts`)

| Schema | Content |
|---|---|
| `Analysis` | statement (cleaned), language, topic/subtopic, gradeLevel, withinCurriculum, concepts, givens, unknowns, constraints, **status** (`solvable` / `ambiguous` / `unsupported` / `not_a_problem`) + reason, OCR `interpretationNotes` |
| `Hint` | level 1–4 (question → concept → guidance → explicit setup), `question`, optional `cue`, hidden `explanation` + `math`, `stepId` it leads to, figure `focus` ids |
| `Step` | title, explanation, `math` (display LaTeX), `reason` (theorem, textbook naming), `geometryActions` (`highlight` / `show` + target ids) |
| `Figure` | construction: points (`free`, `polar`, `midpoint`, `on_segment`, `foot`, `intersection`, `line_circle`, `on_circle`, `tangent`, `reflect`, `rotate`, `translate`, triangle centres), lines/rays/segments, circles, angles, equal/parallel marks, `checks` (`given` / `derived`), `scale` (`exact` / `schematic`) |
| `AnswerCheck` | `substitute`, `identity`, `inequality`, `value` — plain ASCII maths evaluated by `shared/src/expr.ts` |
| `Solution` (API) | lesson + `Verification` (`verified` / `partial` / `unverified` / `not_checkable`, per-check results, `figureIssue`) + status/error/model/promptVersion/attempts |

### Configuration and prompts (`worker/src/solver/`)

- **`curriculum.ts`** holds the teaching level as data: the allowed knowledge for Vietnamese
  Grade 9, the forbidden methods (calculus, vectors, the laws of sines and cosines, …), and the
  method preferences.
- **`prompts.ts`** has separate sections for role, security, curriculum, language, teaching and
  hints, format, geometry language, and verification. `PROMPT_VERSION` is stored with every lesson
  and is part of the cache key.
- **`llm.ts`** defines the `JsonModel` interface. OpenAI Chat Completions uses strict
  `json_schema` and `reasoning_effort`. The dev-only `mock.ts` provides deterministic lessons and
  failure scenarios.
- **`jsonSchema.ts`** derives the strict JSON Schema from the zod schema, the single source of
  truth.

### Geometry

- **Construction engine** (`shared/src/geometry.ts`). It resolves points in dependency order,
  detects cycles and impossible constructions, and never produces NaN.
  - The same code verifies figures on the server and renders them on the client.
  - **GeoGebra-style dragging** (`isDraggable`, `dragTo`):
    - free points follow the pointer;
    - `on_segment` points slide along their segment and `on_circle` points around their circle;
    - `polar` points change their distance and direction;
    - every dependent point (midpoint, foot, intersection, tangent, …) is re-constructed on each
      move, so the construction's relationships always hold.
  - The prompt tells the model to build *explorable* figures: points that are free in the problem
    are free, and constrained points are constructed. For example, a right angle is built as
    rotate + on_segment, and an isosceles apex sits on the perpendicular bisector. Dragging then
    explores valid versions of the problem.
  - If a drag breaks one of the problem's *given* numbers or conditions, the figure shows a notice,
    and Reset restores it. A drag that leaves points outside the frame re-fits the view.
- **Scene builder** (`shared/src/figureScene.ts`). It is platform-neutral: it turns
  figure + view transform + highlight state into screen primitives (lines, circles, angle arcs,
  right-angle squares, tick and arrow marks, point labels). It also places labels greedily to
  avoid collisions and hit-tests taps.
- **Renderer** (`mobile/src/components/geometry/GeometryView.tsx`). It draws the primitives with
  react-native-svg (native and web) and handles:
  - pinch or wheel zoom around the focus point;
  - one-finger pan;
  - tap to select, showing the measurement when the figure is to scale;
  - GeoGebra-style dragging of the blue points (text selection is disabled on web);
  - reset and a labels toggle.
- **Synchronization:**
  - the active hint highlights its `focus` objects; the active step highlights its
    `geometryActions` targets, and everything else is dimmed;
  - construction lines appear once the student reaches the step that `show`s them;
  - the model's target names are mapped through aliases ("AB", "seg_AB", "angle_B", …).

### Verification (`shared/src/verify.ts`, `shared/src/expr.ts`)

- **The expression evaluator** is a small Pratt parser. It has no `eval` and no property access.
  It supports implicit multiplication, sqrt/cbrt/abs, trig in degrees, relations, and "and"/"or"
  conditions.
- **Algebra:**
  - roots and systems are substituted back into the original equations;
  - simplifications are sampled at many points inside the stated domain;
  - inequalities are compared point by point against the claimed solution set;
  - numeric results are evaluated.
- **Geometry:**
  - given conditions must hold on the constructed figure; otherwise the figure is dropped and the
    lesson is kept;
  - derived claims (the answer angle or length, proven ⊥ / ∥ / concyclic / equal) are measured.
    Measured *values* count only for `exact` figures, while shape-independent relations count
    always.
- **Status:** a failed check triggers one retry with the precise failures. A lesson that still
  fails is shown as **unverified** (red, "check carefully"), never as correct.

### Safety

- Problem text goes only in the user message, inside delimiters, framed as untrusted.
- The output is schema-constrained and strictly validated. Extra fields are rejected, all text is
  NFC-normalized, and the model can't produce URLs, code, or UI.
- Rendering uses KaTeX with `trust: false`, and figure labels are SVG text.
- Solving has per-device and per-IP limits (30 and 90 per hour), a bounded token budget (at most
  2 attempts, 24k output tokens each), and problem text capped at 6,000 characters.
- Every solution row carries its `owner_id`, and deleting a scan deletes its lesson.

### Client flow

- **Save.** When the problem is saved, solving is prefetched in the background
  (`PREFETCH_SOLVE_ON_SAVE`).
- **Solve screen.** `POST /solve` either:
  - returns the cached lesson,
  - generates one, or
  - gets `409 solve_in_progress` and polls `GET /solution` (`202` while pending).
- **Leaving mid-solve** is safe: the server finishes the work (`ctx.waitUntil`). If that process
  dies, the stale lock turns into a retryable failure.
- **Progress** (revealed hints, open solution) is kept for the app session.

## Future milestones (planned, not built)

- **V2 attempts:** a `attempts` table keyed by (`solution_id`, `step_id`); a checker prompt
  compares the student's work to the stored steps and figure checks, detecting misconceptions per
  step.
- **V3 knowledge profile:** aggregate by `analysis.concepts` and the steps' `reason` (theorem
  names) per `owner_id`, adopted by real accounts later.
- **V4 diagnostics / curriculum:** `Curriculum` is already data, so levels and syllabi become
  selectable.
- **Web app:** reuse `shared/` (contract, verification, geometry engine, scene builder) and the
  API unchanged. Expo web already renders the full flow; a Next.js app would only need a DOM/SVG
  renderer for `Scene`.
