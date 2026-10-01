# Project current state (2026-10-01)

Branch `sprint/model-research`. This describes what exists and works, verified against the code, tests and
local runs, not plans. Earlier snapshots: docs/AI_SOLVER_CURRENT_STATE.md (solver), ARCHITECTURE.md, TASKS.md.

## 1. User journey (as implemented)

```
Expo app (iOS / Android / web)
  photo, screenshot or PDF page (web), or typed text
  → POST /v1/scans: upload validation (size, magic bytes, dimensions) → R2 → OCR provider
      local: PaddleOCR-VL-1.6 on llama.cpp (text mode + deterministic parser, logprob confidence)
      also: Gemini / OpenAI / Anthropic adapters (Gemini disabled by policy), mock for dev
  → review screen: KaTeX preview, edit with symbol bar, confirm (multi-question split)
  → POST …/solve: shared-lesson cache → one structured LLM call → deterministic verifier
      (+ language hygiene, Grade 9 checker, figure construction, claim measurement) → ≤ 1 retry → D1
      live progress (streaming) shown while generating
  → lesson screen: Dạng bài / Cho biết / Cần tìm / Kiến thức, hint-first progression, steps, Đáp số,
      verification badge, interactive GeoGebra-style figure (drag, zoom, highlights per step)
```

## 2. Working features (with evidence)

| Area | State | Evidence |
|---|---|---|
| Device identity and isolation | Anonymous 256-bit device token; SHA-256 as owner_id; every query owner-scoped | `worker/src/auth.ts`, security tests |
| Uploads | Validated, stored in R2, served by HMAC-signed expiring URLs | `images.ts`, `imageUrls.ts` |
| OCR | PaddleOCR-VL local: 20/20 fixtures, CER ≈ 0.02, ~3 s/photo; dense exam pages 19–23 s | MODEL_BENCHMARK.md |
| Solving | One-call lesson + deterministic verifier; hosted Nemotron (free) or local Qwen | EXP-010, OPT-008…010 |
| Verification | Answer checks (substitute, identity, inequality, value, integers), figure construction + claim measurement, statement givens, restatement detection, Grade 9 checker, language hygiene | 297 worker tests |
| Teaching UX | Hint-first lesson, progressive hints, steps, verification badge, figure sync | e2e scripts in tools/e2e |
| Reliability | Retry policy (serious feedback only, 150 s budget), effort step-down, quota fail-fast, failed regenerate keeps lesson, optional failover | OPT-003…005, tests |
| Live progress | SSE streaming, progress row (migration 0005), app polling with a draft card | OPT-004 |
| Caching | Own lesson reused across prompt versions; shared verified-lesson library per problem key + prompt version | live e2e test |
| Abuse limits | Per-device and per-IP hourly rate limits (scans, solves) | `rateLimits.ts` |
| Cleanup | Daily cron removes unconfirmed drafts after 7 days | `cleanup.ts`, wrangler cron |
| i18n | Vietnamese and English, voice "bạn/mình" | `strings.ts` |
| Web extras | Screenshot capture, PDF page upload | e2e-web-sources |

## 3. Model and inference setup

- **Solver**: `SOLVER_PROVIDER=local` pointed at OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`.
  Reasoning effort adapts to the tier (minimal for simple problems, low otherwise). Prompt solver-v2.3.
  Local fallback: Qwen3.5-9B Q4_K_M on llama.cpp (5–9 tok/s on this laptop on battery).
- **OCR**: PaddleOCR-VL-1.6 (0.9B) on a local llama.cpp server.
- **Gemini**: disabled by policy. OpenAI/Gemini adapters remain for a paid configuration.
- **Keys**: only in `worker/.dev.vars` (gitignored) or Cloudflare secrets; nothing in the app bundle.

## 4. Tests

| Suite | Count | Covers |
|---|---:|---|
| worker (vitest) | 297 in 18 files | evaluator, geometry, verifier, pipeline, prompts, OCR parsing, security, providers, grade-level, language, streaming, techniques |
| typecheck | shared, worker, mobile | `npm run check` |
| mobile lint | expo lint | clean |
| web e2e (Playwright scripts) | 10 scripts | scan/upload/camera flows, failures, solve, drag, worksheet, web sources; run by hand |
| benchmarks | datasets v1 (40) and chuyen-v1 (72) | tools/benchmark, tools/exams |

There is no CI pipeline, and mobile has no unit tests (only e2e scripts run by hand).

## 5. Known weaknesses

1. **Hard proofs**: olympiad-style geometry (PTNK 2026 Câu 4, 2023 B5d) is not solved by the free model
   (it truncates) and is rarely verifiable.
2. **The free solver's Vietnamese**: mixes in Chinese, English or Portuguese and drops diacritics. Patched
   and retried, but not fluent.
3. **Free-tier quota** (≈ 50 requests/day): cannot serve real users. One afternoon of testing exhausted it.
4. **Local inference** on this laptop is 4–20 min per problem: a development fallback only.
5. **Verification coverage**: proofs without a figure (number theory, combinatorics, games) are "not
   checked", which is honest but means no guarantee.
6. **Grade-level checker** is keyword-based.

## 6. Missing features

- Real accounts (device tokens only; no recovery across devices).
- Production OCR host (PaddleOCR-VL runs only locally; production would fall back to a paid OCR).
- Teacher review workflow for datasets and flagged lessons.
- Monitoring and alerting (only Cloudflare logs; no error tracking, no dashboards).
- Automated CI and deployment pipeline; rollback is manual (`wrangler rollback` exists but isn't documented).
- Offline mode for lessons beyond the local cache.

## 7. Technical debt

- `worker/scripts` holds many one-off experiment scripts next to maintained tools.
- Two experiment logs (root EXPERIMENT_LOG.md and docs/EXPERIMENT_LOG.md) and several overlapping status
  documents (PROGRESS.md, TASKS.md, AI_SOLVER_CURRENT_STATE.md, this file).
- `routing.ts` comments still describe old Gemini 2.5 defaults.
- The local-provider class is called `LocalJsonModel` but also serves hosted endpoints.
- The response cache (`tools/benchmark/cache`) has untracked files growing in the working tree.

## 8. Production blockers

1. **No production inference plan within budget**: the free tier can't serve users; Gemini is disabled.
   A paid open-model endpoint needs authorisation.
2. **Production OCR**: the local OCR server isn't deployable on Workers.
3. **Production config not deployed**: `ALLOWED_ORIGINS` (CORS), migrations 0005, secrets.
4. **Correctness on the target exams is not established** for the hosted model on held-out chuyên papers
   (docs/CURRENT_SOLVER_EVALUATION.md).
5. **No monitoring or alerting.**
