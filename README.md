# Math Teacher

An AI mathematics teacher for Vietnamese secondary-school students, Grade 9 first. Two milestones
are implemented:

```
M1  Photo (camera or library) → crop → OCR → student checks & edits → save → history
M2  Saved problem → understand → Grade-9 solution → hint-first lesson → interactive geometry
```

The product teaches rather than dumping answers:

- the student works through graded hints and reveals each explanation only when they want it;
- the full solution is a structured lesson with a highlighted figure;
- every answer is machine-checked before it is shown as correct.

## Status

| Area | Status |
|---|---|
| Camera capture with framing guide + auto-crop to the guide | ✅ implemented |
| Upload from photo library (validation, HEIC → JPEG, size/dimension checks) | ✅ implemented |
| Review screen with draggable crop box, rotate, retake | ✅ implemented |
| OCR pipeline behind a provider interface (OpenAI, Anthropic, dev-only mock) | ✅ implemented |
| Typeset maths (KaTeX, bundled for offline use) in results, preview, and history | ✅ implemented |
| Editing with maths symbol bar, live preview, and broken-markup warning | ✅ implemented |
| Save, history (paginated, offline snapshot), problem detail, delete | ✅ implemented |
| Vietnamese + English UI (follows device language), light/dark mode | ✅ implemented |
| Per-device private data, rate limiting, idempotent uploads, draft cleanup | ✅ implemented |
| OCR accuracy measured with a real provider (OpenAI `gpt-4.1`) | ✅ 16/16 on the synthetic test set, mean CER ≤ 0.2%, ~2 s per image (2 runs); real phone photos still to be added |
| **Multi-question photos:** OCR splits a page into separate problems (sub-parts stay together); the student keeps/edits/skips each; every question is saved and solved separately (per-question lessons, "+N" badge in history) | ✅ implemented (real OCR: worksheet split 3/3) |
| **Solver V1:** problem understanding, classification, curriculum check (Vietnamese Grade 9), ambiguous/unsupported detection | ✅ implemented |
| Hint-first lesson: 2–6 graded hints (question → concept → guidance → setup), revealed one at a time | ✅ implemented |
| Step-by-step solution (theorem named per step), final answer, per-lesson cache | ✅ implemented |
| Deterministic verification: substitution, identity and inequality sampling, numeric checks, figure measurements; one corrective retry; "unverified" shown honestly | ✅ implemented |
| Interactive geometry like GeoGebra: drag the blue points and the construction follows (feet, midpoints, tangents, intersections stay valid; points on segments or circles slide along them); pinch/wheel zoom, pan, tap-select with live measurements, "figure changed" notice, reset | ✅ implemented |
| Step/hint ↔ figure synchronization (highlight, reveal construction lines) | ✅ implemented |
| Solver quality measured (`gpt-5.5`, 20-problem VI/EN test set) | ✅ 20/20 correct, all verified; median 15 s, max 50 s |
| Student attempts, misconception detection, knowledge profile, adaptive curriculum, accounts | ⏳ planned |

## Repository layout

```
mobile/        Expo SDK 57 app (React Native, TypeScript, expo-router)
  src/app/       screens: index (home), camera, review, process, scan/[id], problem/[id], history, solve/[id]
  src/components/lesson/    LessonView, hint/step/answer cards, RichText
  src/components/geometry/  GeometryView (SVG renderer + gestures)
  src/api/       typed API client + error mapping
  src/components math renderer (KaTeX), crop box, symbol bar, shared UI
  src/lib/       image preparation, picker, device token, config
worker/        Cloudflare Worker API (TypeScript), D1 + R2
  src/ocr/       OcrProvider interface, providers, prompt, output normalization
  src/solver/    curriculum config, prompts, JSON model client, solve pipeline, dev mock
  src/routes/    scans + signed images
  migrations/    D1 schema
  test/          unit tests (vitest);  scripts/smoke.mjs: API end-to-end test
shared/        used by both sides:
  contract.ts, solution.ts   API + lesson schemas (zod)
  expr.ts                    safe expression evaluator (verification)
  geometry.ts                construction engine;  figureScene.ts: renderer-neutral scene + hit-testing
  verify.ts                  lesson verification;  mathText.ts: $…$ parsing, LaTeX→Unicode
tools/ocr-eval/  OCR test set (16 synthetic images across categories) + evaluation harness
tools/e2e/       Playwright end-to-end tests of the web build (scan, solve, failure paths)
tools/solver-eval/  20-problem solver test set (algebra, geometry, word, bad input; VI/EN)
```

For design details and trade-offs, see [ARCHITECTURE.md](ARCHITECTURE.md). The sprint log is in
[PROGRESS.md](PROGRESS.md) and the task list in [TASKS.md](TASKS.md).

## Running locally

Requirements: Node 20+ (tested with 24), npm. For iOS: Xcode + the iOS Simulator, or Expo Go on a
phone.

```bash
npm run setup                      # installs shared/, worker/, mobile/ and creates the local D1 schema
cp worker/.dev.vars.example worker/.dev.vars   # dev config (mock OCR by default)

npm run dev:worker                 # API on http://localhost:8787
npm run dev:mobile                 # Expo dev server: press i (iOS), a (Android) or w (web)
```

In development the app finds the API automatically at `http://<metro-host>:8787`, so the
simulator and a phone on the same Wi-Fi both work without configuration. To use a real OCR
provider locally, put a key in `worker/.dev.vars`:

```bash
OCR_PROVIDER=openai          # or anthropic
OPENAI_API_KEY=sk-...        # or ANTHROPIC_API_KEY=...
```

Camera capture needs a real device; the iOS Simulator has no camera, and the app shows a "camera
not available → upload instead" state there. Everything else works in the simulator.

### Checks

```bash
npm run check        # typecheck (shared, worker, mobile) + worker unit tests + mobile lint
npm run smoke        # API end-to-end test against the running worker (54 checks)
cd worker && npm run smoke:solve          # solve API: auth, cache, failures, retry, concurrency (23 checks; mock worker)
cd worker && npx tsx scripts/solver-eval.ts gpt-5.5 medium   # solver quality over tools/solver-eval (real model)
cd worker && npx tsx scripts/solve-once.ts "problem text"      # solve one problem and print the lesson
npm run ocr:eval     # OCR accuracy over tools/ocr-eval (meaningful only with a real provider)
cd tools/e2e && npm install && npm run setup && npm run e2e   # web E2E (see tools/e2e/README.md)
cd mobile && npm run export   # production bundles for iOS, Android and web
```

## Environment variables

**Worker** (`worker/wrangler.toml` `[vars]`; secrets via `wrangler secret put`):

| Name | Purpose | Default |
|---|---|---|
| `ENVIRONMENT` | `production` or `development` (the mock provider only works in development) | `production` |
| `OCR_PROVIDER` | `openai`, `anthropic`, or `mock` | `openai` |
| `OPENAI_MODEL` / `ANTHROPIC_MODEL` | model ids | `gpt-4.1-mini` / `claude-opus-5` |
| `OCR_TIMEOUT_MS` | hard timeout per OCR call | `45000` |
| `OCR_LIMIT_PER_DEVICE_PER_HOUR` / `OCR_LIMIT_PER_IP_PER_HOUR` | abuse limits | `40` / `120` |
| `SOLVER_PROVIDER` | `openai` or `mock` (development only) | `openai` |
| `SOLVER_MODEL` / `SOLVER_REASONING_EFFORT` | cheap primary solver model | `gpt-5.4-mini` / `low` |
| `SOLVER_FALLBACK_MODEL` / `SOLVER_FALLBACK_REASONING_EFFORT` | strong model: geometry, and retries when checks fail | `gpt-5.5` / `medium` |
| `SOLVE_TIMEOUT_MS` | total budget per solve, including one retry | `170000` |
| `SOLVE_LIMIT_PER_DEVICE_PER_HOUR` / `SOLVE_LIMIT_PER_IP_PER_HOUR` | solve abuse limits | `30` / `90` |
| `DRAFT_RETENTION_DAYS` | unconfirmed scans older than this are deleted nightly | `7` |
| `ALLOWED_ORIGINS` | CORS origins (only needed for Expo web) | empty |
| `IMAGE_URL_SECRET` (secret) | HMAC key for signed image URLs, 32+ random chars | **required** |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (secret) | key for the selected provider | — |

**Mobile:** `EXPO_PUBLIC_API_URL` is the Worker URL. It is required for production builds and
optional in development. It is not a secret; no keys ever ship in the app.

## OCR pipeline

1. **Client.** Crop to the problem, then re-encode as JPEG with the long side ≤ 1280 px (typically
   100–350 KB). This fixes EXIF orientation and HEIC, and keeps vision token use down.
2. **Worker validation.** Size, real file type from magic bytes, and pixel dimensions.
3. **Storage.** The image goes to R2 (private); a draft row goes to D1.
4. **Provider call.**
   - A fixed system prompt tells the model to transcribe only. Text inside the image is data,
     never instructions.
   - Output is constrained to a JSON schema.
   - The hard timeout is 45 s, and malformed output gets one automatic retry.
5. **Normalization** (`worker/src/ocr/normalize.ts`) is the single trust boundary for model
   output. It:
   - validates the shape strictly;
   - NFC-normalizes Vietnamese text;
   - falls back to plain text if the maths markup is broken;
   - rejects looping or degenerate output;
   - marks `low_quality` when the model reports low confidence, blur, cut-off or uncertain
     handwriting.
6. **Result** (`OcrResult`):
   - `status`: `success`, `low_quality`, `no_math_found` or `unreadable`.
   - `rawText` holds Unicode maths; `formattedText` holds prose plus `$…$` LaTeX.
   - `language`, `issues`, `provider` and `model` are included.
   - `confidence` is the model's self-report, explicitly labelled as uncalibrated.
7. **The student verifies.** The confirmed text is stored separately from the raw OCR, along with
   whether it was edited.

To swap providers, implement `OcrProvider` (one method) and register it in
`worker/src/ocr/service.ts`.

## Solver

The design is in [ARCHITECTURE.md → Solver V1](ARCHITECTURE.md#solver-v1-milestone-2). In short:

**Pipeline.** One strict-JSON model call returns the whole lesson. zod then validates it, and
deterministic checks (no AI) verify its structure, figure, and answer. If a check fails, there is
one corrective retry with the exact failures. The result is stored per problem and reused, so
revealing hints never re-solves.

**Endpoints.**
- `POST /v1/scans/:id/questions/:qid/solve` with `{ regenerate?: boolean }` (`qid` = `q1`, `q2`, …;
  `POST /v1/scans/:id/solve` is an alias for `q1`). It returns the stored lesson or
  generates one, and answers `409 solve_in_progress` if one is already running.
- `GET /v1/scans/:id/questions/:qid/solution` returns `202` while pending.
- `POST /v1/scans/:id/confirm` takes either `{ text }` or `{ questions: [{ label, text }] }`.

**Teaching level.** `worker/src/solver/curriculum.ts` defines Vietnamese Grade 9: allowed topics,
forbidden methods, and method preferences. The prompts (`worker/src/solver/prompts.ts`) are split
into curriculum, teaching/hints, geometry language, verification, and security sections, and are
versioned.

**Geometry.** The model describes *constructions* (midpoint, foot of the perpendicular,
intersection, tangent, …), never pixels.
- `shared/src/geometry.ts` computes the coordinates and `shared/src/figureScene.ts` produces
  drawable primitives, so a future web app reuses both.
- The figure must satisfy the problem's givens or it is dropped.
- Derived claims, such as the answer angle, are measured on it.

## Cost

Measured per lesson (see PROGRESS.md, 2026-09-29):

| Problem type | Route | Cost per lesson |
|---|---|---|
| Algebra, equations, word problems | `gpt-5.4-mini` (low effort); escalates to `gpt-5.5` only if the checks fail | about $0.005 |
| Geometry (detected from the wording) | `gpt-5.5` directly, because the cheap model's figures failed the checks about 90% of the time | about $0.07–0.12 |
| Reading a photo (OCR, `gpt-4.1-mini`, ≤1280 px) | | well under $0.01 (often ~$0.001–0.003) |

- Every AI call logs its tokens and estimated cost (`[ocr] usage:` and `[solve …] usage:` lines).
  Prices are in `worker/src/solver/pricing.ts`.
- Lessons are cached per question and are never regenerated when hints are revealed.
- Solving on save is off by default (`PREFETCH_SOLVE_ON_SAVE`).
- Local development uses the free mock AI (`OCR_PROVIDER=mock`, `SOLVER_PROVIDER=mock` in
  `worker/.dev.vars`). Switch both to `openai` to test real quality.

## Database & storage

- **D1 `scans`**: one row per scanned image, holding owner, status (`draft` → `confirmed`), image
  metadata, the latest OCR result (JSON), attempts, the confirmed text, and timestamps.
- **D1 `rate_limits`**: fixed-window counters.
- **D1 `scans.questions_json`**: the confirmed questions `[{ id, label, text }]`.
- **D1 `solutions`**: one lesson per question (`scan_id`, `question_id`), holding the owner, status (`pending` / `ready` /
  `failed`), problem hash, lesson JSON, verification JSON, model, prompt version, attempts,
  duration, and the lock timestamp.
- **R2**: the original images, private, served only through expiring HMAC-signed URLs.

## Security summary

- AI keys exist only as Worker secrets. The production bundles were audited and contain none.
- **Anonymous device identity.** A random 256-bit token is kept in the Keychain/Keystore; the
  server stores only its SHA-256. Every query is scoped to the owner, and cross-device access is
  tested.
- **Uploads.** The server enforces size limits, identifies the file type from its bytes, and
  checks dimensions; parameterized SQL is used everywhere.
- **Model output** is treated as untrusted:
  - schema-validated;
  - rendered with KaTeX `trust: false`, with prose inserted as text;
  - shown in a WebView that blocks all navigation.
- **Abuse protection.** Per-device and per-IP rate limits, idempotency keys, and an atomic OCR lock
  (duplicate and concurrent requests are tested).
- **Errors.** Clients see a closed set of error codes with generic messages; details only go to
  the logs.

## Known limitations

**Solver**
- Solve latency is 10–50 s; the delay is hidden by starting the solve when the problem is saved.
  There is no streaming yet.
- Verification catches wrong *answers* and false geometric claims. It does not check each prose
  step, and proofs are checked only through their figure claims.
- Solver quality was measured on 20 problems. That is a baseline, not proof of reliability across
  the whole curriculum.
- Hints and steps render inline maths as Unicode, with KaTeX for display equations. Each revealed
  display equation is a WebView on native, which could be heavy on older phones.
- Dragging keeps a condition only if the model *constructed* it (e.g. a right angle built with
  rotate). Conditions written only as checks can break while dragging; a notice then says so.
  There is no general constraint solver.
- Lesson progress (revealed hints) is kept only for the app session.

**Scanner**

- **OCR accuracy has only been measured on the synthetic test set.** With OpenAI `gpt-4.1` it
  scored 16/16 with a mean character error rate of at most 0.2% over two runs. The images are
  rendered fonts with simulated photo effects, and the "handwritten" ones use a handwriting-style
  font. Real phone photos of textbooks and real handwriting still need to be added before these
  numbers can be trusted for production.
- Native camera capture was not exercised on a physical device during the sprint. The simulator
  has no camera, and the web E2E used Chrome's fake camera. Permission-denied and camera-unavailable
  states were verified on the iOS Simulator.
- Anonymous device identity means history is lost if the app is deleted, and is not shared across
  devices.
- Editing uses LaTeX source with a symbol bar and live preview. That is workable, but it is not a
  visual equation editor.
- On web, Chrome's fake camera preview appears mirrored. Web is a development target only.

## Roadmap

1. **Now: Milestone 1**, reliable scanning (this repo).
2. **Milestone 2 (done): Solver V1.** Understand → solve → hints → interactive geometry.
3. **V2.** The student submits attempts per step; the AI checks them and detects misconceptions.
4. **V3.** A student knowledge profile (by concept and theorem) drives adaptive difficulty.
5. **V4/V5.** Diagnostic assessment, a personalized curriculum, and a long-term AI teacher.
