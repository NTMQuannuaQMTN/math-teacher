# Tasks

Legend: [x] done · [ ] todo · [-] deferred (with reason)

## Foundation
- [x] Inspect previous implementation (git history); decide keep/rebuild
- [x] Monorepo layout: `mobile/` (Expo), `worker/` (Cloudflare), `shared/` (contract), `tools/ocr-eval/`
- [x] Shared API contract with Zod (OcrResult, Scan, errors, limits)
- [x] Maths-text utilities (parse `$…$`, LaTeX→Unicode, NFC normalization, markup checks) + tests

## Backend (worker/)
- [x] D1 schema (scans, rate_limits) + migration
- [x] Device-token auth, owner-scoped queries
- [x] Upload validation (size, magic bytes, dimensions)
- [x] R2 storage + signed expiring image URLs
- [x] OCR provider interface + OpenAI, Anthropic, mock providers (+ adapter tests with stubbed fetch)
- [x] OCR output normalization/validation (malformed, degenerate, empty, injection-safe)
- [x] Endpoints: create, retry OCR, confirm, list (keyset), get, delete, image
- [x] Idempotency + OCR lock (duplicate / concurrent submissions)
- [x] Rate limiting (per device, per IP)
- [x] Cron cleanup of stale drafts
- [x] Provider resolved before storing anything (misconfiguration can't strand drafts)

## Mobile (mobile/)
- [x] App shell: expo-router, theme (light/dark), i18n (vi/en), device token
- [x] Home: identity, Scan (primary), Upload, unfinished scan, recent problems, empty state, offline snapshot
- [x] Camera: permissions (undetermined/denied/blocked/revoked), guide frame, capture, auto-crop, torch, gallery, unavailable fallback
- [x] Upload: picker, cancellation, validation (type/size/dimensions/corrupt), normalization to JPEG
- [x] Review/crop: draggable crop box (corners, edges, move), rotate, reset, retake
- [x] OCR processing: stages, cancel, timeout, retry, idempotent resubmit, in-progress polling
- [x] Result: KaTeX rendering, status banners, demo label, edit with symbol bar + live preview + markup warning, read again, retake, type-it-yourself, discard guard
- [x] Save + saved problem detail (full-screen photo viewer); delete
- [x] History list with thumbnails, pagination, pull to refresh, offline fallback
- [x] Centralized API client with timeouts, cancellation, typed errors, response validation

## Quality
- [x] Typecheck + lint (all packages), production export (iOS, Android, web), worker dry-run build
- [x] Visual QA: iOS simulator (home, maths rendering, camera states), web light/dark, vi/en
- [x] Web E2E: upload flow, camera flow (fake camera), history (11 steps)
- [x] Web E2E failure paths: provider error, no-math, unreadable, low quality, offline + retry, cancel mid-OCR + resume (9 steps)
- [x] OCR eval harness over the fixture set
- [x] Run OCR eval with a real provider (OpenAI gpt-4.1): 16/16, mean CER ≤ 0.2%
- [ ] Physical-device test of camera capture + guide-frame crop alignment
- [ ] Collect real phone photos (textbook + handwriting) for the OCR test set

## Next candidates (post-M1)
- [ ] Measure preprocessing value (contrast/deskew) with the eval harness before adding any
- [ ] Visual (WYSIWYG) equation editing for students who don't know LaTeX
- [ ] Accounts that adopt a device's owner_id

## Milestone 2: Solver V1
- [x] Shared lesson contract (analysis, hints, steps, figure, answer checks, verification) with zod → strict JSON Schema
- [x] Curriculum config (Vietnamese Grade 9) and modular, versioned prompts
- [x] One-call solve pipeline with validation, deterministic verification, and one corrective retry
- [x] Safe expression evaluator; algebra checks (substitute, identity, inequality, value)
- [x] Geometry construction engine (16 point constructions), figure checks, target aliases
- [x] Solve API (cache by problem hash and prompt version, lock/409/202 polling, rate limits, cascade delete)
- [x] Dev mock solver with failure scenarios
- [x] Renderer-neutral scene builder: labels with collision avoidance, marks, right angles, hit-testing
- [x] GeometryView: SVG, pinch/wheel zoom, pan, tap-select with measurements, drag free points, reset, labels
- [x] Lesson UI: figure pinned on top, understand card, sequential hints with reveal, steps, final answer, verification badge
- [x] Hint and step ↔ figure synchronization; construction lines revealed per step
- [x] Error states: ambiguous/unsupported/not a problem, provider failure + retry, unverified, leave and resume
- [x] Solve prefetch on save
- [x] Tests: 110 unit tests, 23-check solve smoke test, web solve E2E (real model), UI failure E2E, 20-problem eval (20/20)
- [x] Native iOS visual check of the lesson (dev route `/dev/lesson`)
- [ ] Persist lesson progress across app restarts
- [ ] Streaming / partial lesson display to cut perceived latency further
- [ ] Anthropic solver adapter (the OCR adapter exists; the solver uses the `JsonModel` interface)
- [ ] Larger solver test set from real student photos; per-topic accuracy tracking
- [ ] Device E2E (Maestro/Detox) for native gestures

## Deferred (explicitly out of scope)
- [-] Student attempts, misconception detection, knowledge graph, mastery, adaptive curriculum, dashboards: later milestones
