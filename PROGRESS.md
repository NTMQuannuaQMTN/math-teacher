# Progress log

## 2026-09-28 — Sprint start

**Starting state.** The working tree was empty: all tracked files were deleted but not staged, so
the previous MVP exists only in git history (`HEAD` = `dce3aa1`). I treated this as a restart.
The old code was used as reference, not restored.

**Findings about the previous implementation**
- The Expo + Worker + D1 + R2 stack fits the brief, so I kept it.
- It was built around solving (classify, geometry diagrams, solve), which is out of scope now.
- There was no ownership: anyone with a question id could read it.
- The worker declared `expo` as a dependency and its tsconfig extended Expo's base (a
  misconfiguration).
- All UI lived in one `App.tsx` with a phase state machine; there was no navigation, no in-app
  camera, no crop, and no editing.

**Decisions**
- Rebuild in `mobile/`, `worker/`, and `shared/`. The name `mobile/` avoids an `app/app` clash
  with expo-router.
- Keep Cloudflare (Worker, D1, R2). Add anonymous device-token auth.
- The OCR provider is swappable via `OCR_PROVIDER`. There is no API key on this machine, so the
  full flow is developed against a dev-only mock provider whose output is clearly labelled. Real
  OCR quality **has not been measured**: `tools/ocr-eval` is ready to run once a key is set.

**Done so far**
- Shared contract and maths-text utilities.
- Worker: all endpoints, validation, security, and cleanup.
- 56 unit tests passing; the API smoke test passes 54/54 against `wrangler dev`.
- 16-image synthetic OCR fixture set across all required categories.

## 2026-09-28: Mobile app, testing, polish

**Built**
- The Expo app: 7 screens, a KaTeX renderer, the crop box, the symbol bar, and vi/en copy.
- Details are in TASKS.md.

**Bugs found by testing, and fixed**
1. `isWellFormedMathText` accepted mismatched delimiters (`Giá $5, tìm $x^{2`). It now also
   rejects LaTeX leaking into prose, and Vietnamese prose swallowed into maths.
2. `latexToPlain` rendered `90^{\circ}` as `90^°`.
3. Web camera: `onLayout` never fired, so the guide frame was missing and the shutter did nothing.
   Fixed with a window-size fallback.
4. The result/editor saved broken maths markup silently. The editor now shows a live warning.
5. Offline upload failure was titled "Couldn't read the problem". It now reads "Couldn't send your
   photo".
6. A misconfigured OCR provider was only detected after the image was stored and the OCR lock was
   taken. The provider is now resolved first.
7. Display maths showed an extra blank line after a `$$…$$` block.
8. Very long display equations were clipped. They now shrink to fit, down to 70%.
9. The first version of the shrink-to-fit script used `Function.toString()`. That would have
   injected "[bytecode]" in Hermes release builds; it was replaced with a string literal.
10. The blocked-camera screen had two primary buttons.
11. Lint (React Compiler rules): a ref was written during render in CropBox, and there were
    duplicate imports.

**Verification**
- Unit tests: 60 passing (math text, OCR normalization, image sniffing, signed URLs, auth,
  provider adapters).
- API smoke test: 54/54 passing.
- Web E2E: 11/11 on the happy path and 9/9 on failure paths.
- Visual QA on the iOS Simulator (native WebView maths, camera unavailable, and permission
  blocked), plus web in light/dark and vi/en.
- Production export for iOS, Android, and web succeeds; the bundle audit found no secrets.
- The Worker dry-run build succeeds, and the cron cleanup runs.

**Not done / honest gaps**
- OCR accuracy with a real provider has not been measured (no key available). The harness exists.
- Camera capture has not been tested on a physical device.

## 2026-09-28: First real OCR measurement (OpenAI gpt-4.1)

- **First run: 14/16, mean CER 5.0%.** The maths was read correctly in every case; all the
  misses came from the model's plain-text field:
  - an ASCII-art fraction spread across three lines;
  - `x^2` instead of `x²`;
  - `□` placeholders for the system-of-equations brace;
  - `³√` instead of `∛`.
- **Fix.** `rawText` is now derived deterministically from the validated `formattedText` using
  the shared LaTeX→Unicode converter. The model's plain text is kept only as a fallback when the
  markup is broken. Two unit tests were added (62 total).
- **After the fix: 16/16, mean CER 0.2%, then 0.0% on a second run.** Latency is about 1.5–3.3 s
  per image.
  - The prompt-injection image was transcribed verbatim and not solved.
  - The non-maths image returned `no_math_found`, and the blurred image was detected.
- The app E2E (Vietnamese) passes with real OCR, including camera capture through the guide-frame
  crop.
- **Caveat:** the test set is synthetic. The next step is adding real phone photos of textbooks and
  real handwriting.

## 2026-09-28: Native upload bug (reported from a physical phone)

- **Symptom.** On a phone, every scan failed with "No internet connection".
- **Root cause.** Since SDK 52, Expo installs its own `fetch` as the global `fetch`. Its FormData
  encoder rejects React Native's classic `{ uri, name, type }` file descriptor ("Unsupported
  FormDataPart implementation"), so no upload request was ever sent.
  - The web E2E didn't catch it because it runs on the browser's `fetch`.
  - The API smoke test didn't catch it because it runs on Node's `fetch`.
- **Fix.** The image is attached as an `expo-file-system` `File` (Blob-like, with `bytes()`).
- **Diagnostics.** Development builds now log the resolved API URL and the underlying error of any
  network failure (`[api] …` in the Metro terminal).
- **Verified on native iOS** with a dev-only self-test route, `/dev/upload?src=<image url>`. It
  downloads an image to the device and uploads it through the real client: upload OK, and OpenAI
  OCR returned the correct Vietnamese text.
- **Lesson.** The native network path needs its own test. `/dev/upload` now covers it until
  device E2E (Maestro/Detox) is set up.

## 2026-09-29: Milestone 2, Solver V1

**Decisions**
- **Model: `gpt-5.5`, reasoning effort medium.** Compared on the 20-problem set:
  - medium: 20/20, median 15 s;
  - low: 19/20 (lost one figure), median 12 s;
  - `gpt-5.4-mini`: correct maths, but its hints jumped between steps and it misnamed methods.
- **One structured call per lesson** plus deterministic verification, instead of a multi-call
  chain. This keeps latency and cost lower and hints consistent with the steps.
- **Construction-based geometry** (GeoGebra-like) instead of model-drawn coordinates. Figures are
  therefore exact, checkable, and draggable.

**Bugs found and fixed**
1. Multi-line derivations were run together by KaTeX; they are now stacked in a `gathered` block.
2. Hints were out of step order (seen with `gpt-5.4-mini`); they are now reordered with a
   warning.
3. The hint card nested a button inside a pressable (invalid HTML, poor a11y); it was
   restructured.
4. To-scale figures allowed dragging, which would break the givens; dragging is now only enabled
   on schematic figures.
5. LaTeX→Unicode printed unknown commands as words ("leftrightarrow"). The symbol table was
   expanded, and unknown commands are now dropped.
6. Figure labels overlapped (side lengths on points, "90°" duplicating the right-angle mark,
   labels on tick marks). Fixed with greedy collision-avoiding placement.
7. A failed solve returned HTTP 502 with a body the client couldn't read; it now returns 200 with
   `status: failed`.
8. An unverified answer was shown in a green "correct" card; the card colour now follows the
   verification status.
9. The "verified" copy mentioned a figure for algebra problems; it is now worded per case.
10. The eval's answer matcher was sensitive to whitespace; this made the first run look like
    17/20 when it was 20/20.

**Verification**
- 110 unit tests.
- API smoke tests: OCR 54/54 and solve 23/23.
- Web E2E: scan 11/11, solve flow with the real model (figure zoom, pan, select, hints, steps,
  cache), and UI failure paths 4/4.
- 20-problem eval: 20/20 correct and verified.
- Native iOS render check of the lesson.
- Production builds.

## 2026-09-29: GeoGebra-style dragging

**Request.** Figures should be interactive like GeoGebra: drag a point and the figure follows.

**What changed**
- **Engine.** Draggability now comes from the construction, not a model flag:
  - free points move;
  - `on_segment` and `on_circle` points slide along their object;
  - `polar` points change their distance and direction.
  Every dependent point is re-constructed on each move.
- **Prompt v1.1.** The model now builds explorable figures: points that are free in the problem
  are free, and constrained points are constructed (a right angle via rotate + on_segment, an
  isosceles apex on the perpendicular bisector). Cached lessons from v1.0 regenerate
  automatically.
- **UI.**
  - A "figure changed" notice appears when a drag breaks a given of the problem.
  - The view re-fits when a drag leaves points out of frame.
  - Fitting reserves the chip row and toolbar bands.
  - Text selection is disabled on web.
- **Tests.**
  - 9 new drag tests (119 total).
  - The geometry eval re-run is 10/10, correct and verified.
  - `tools/e2e/e2e-drag.mjs` drags every point of real lessons. In all three lessons, the right
    angle, feet of perpendiculars, midpoints, isosceles sides, and tangents held.

## 2026-09-29: Multi-question photos

**Request.** Uploading an image with several questions should split it into questions, and each
question should have its own Solve button.

**What changed**
- **OCR.** Returns the page split into problems (numbered exercises; sub-parts stay together;
  headers dropped), each validated. Real OCR on a worksheet split into Bài 1/2/3 correctly, and
  the full OCR eval is 17/17.
- **Check screen.** One card per question, with keep/skip, per-question editing, and
  "Lưu N bài".
- **Saved screen.** Lists every question with its own "Giải với gợi ý" button; the lesson header
  shows the question label; history shows "+N bài".
- **Backend.**
  - `confirm` takes a question list.
  - Migration 0003 adds `scans.questions_json` and makes lessons per question.
  - New routes `/v1/scans/:id/questions/:qid/(solve|solution)`; the old routes alias `q1`.
- **Tests.**
  - 4 new OCR split tests (123 total).
  - 10 new API checks (solve smoke is 33/33).
  - `e2e-worksheet.mjs` (7/7, real models).
  - Regression E2E still passes.

## 2026-09-29: Cost reduction

**Problem.** $5.3 had been spent, almost all of it on development evals of about 65 `gpt-5.5`
solves.

**Measurement.** I added per-call token and cost logging, then measured one lesson:
- `gpt-5.5` (medium effort): $0.070, 18 s;
- `gpt-5.4-mini` (medium effort): $0.029, 35 s;
- `gpt-5.4-mini` (low effort): $0.021, 21 s.

Output (the lesson JSON) is most of the cost; about 90% of the prompt input is cached.

**Cheap-first eval ($1.00; I had estimated $0.50).**
- Configuration: `gpt-5.4-mini` (low), escalating to `gpt-5.5` when a check fails. Result: 18/20
  passed.
- Algebra, word problems and bad input were all correct and verified at about $0.005 each.
- Geometry escalated 8 of 9 times, so it paid for both models ($0.07–0.15). g1 had no figure
  (nothing required one); g7's figure was dropped as invalid.

**Changes.**
- Geometry, detected from the wording, is routed straight to `gpt-5.5`.
- A geometry problem without a figure is now a failed check.
- Solving on save is off by default.
- `.dev.vars` uses the mock AI.

**Expected cost:** about $0.005 per algebra/word lesson, $0.07–0.12 per geometry lesson, and under
$0.01 per photo.
