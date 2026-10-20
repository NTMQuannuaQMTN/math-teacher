# Phase 1 + 2 implementation plan

Date: 2026-10-20. Scope: project foundation (Phase 1) and OCR pipeline (Phase 2). Phase 3+ is out of scope.

## 1. Repository inspection

- `main` history contains a previous prototype (Gemini/Qwen lesson generator, exam datasets) that was
  removed in commit `91b9065 reset`. The working tree contained only an untracked minimal scaffold
  (Next.js landing page, FastAPI `/health`, a 501 solve stub). This plan replaces that scaffold.
- Lessons carried over from the removed prototype's `MODEL_DECISION.md` / `EXPERIMENT_LOG.md`:
  small open models slip on strict JSON (needs schema validation + bounded repair), and deterministic
  checks were far more valuable than extra LLM calls.
- Real, traceable exam papers (PTNK 2023–2026, Hà Nội 2025, HCM 2025, KHTN 2025) are recoverable from
  `git show 91b9065~1:data/exams/...` for the Phase 6 benchmark.

## 2. Verified platform facts (2026-10-20)

| Topic | Finding | Consequence |
| --- | --- | --- |
| Next.js on Workers | Cloudflare docs recommend **vinext** (Vite reimplementation of the Next.js API, beta) for new apps; OpenNext is for existing OpenNext apps. | Write a plain Next.js 16 App Router app; build for Workers with `vinext` + `@vinext/cloudflare`; keep `next build` working as the compatibility baseline. |
| Cloudflare Containers | Workers Paid ($5/mo). Instance types lite → standard-4 (standard-1 = ½ vCPU, 4 GiB, 8 GB disk). Billed per 10 ms while running; scales to zero. Container fronted by a Worker + Durable Object. Disk is not durable storage. | FastAPI + worker run in one container (standard-1). PostgreSQL must be external (managed Postgres). R2 accessed via S3 API. |
| SoCLaaS | NUS SoC OpenAI-compatible gateway, `https://soclaas-api.comp.nus.edu.sg/v1`, Bearer token (verified: 401 `missing bearer token`). Endpoints: `/chat/completions`, `/responses`, `/embeddings`, `/audio/transcriptions`. Model catalogue depends on the key; public labs use alias `default`, `qwen3.6:35b`, `qwen3.8:27b` (vision). No public pricing; described as free for the SoC community; keys have a hard upper limit. | Provider adapter targets `/chat/completions` (+ `/models` for probing). Models, capabilities (vision, JSON schema) and prices are explicit configuration. **A model with no configured price is refused** (fail closed). A probe script verifies the catalogue once a key is available. |

## 3. Architecture for Phase 1 + 2

```
Browser ──► Next.js app on Workers (vinext)
              │  /api/session  → creates guest session (Turnstile) → httpOnly cookie
              │  /api/v1/*     → gateway proxy: Origin check, adds Bearer + X-Gateway-Secret
              ▼
           FastAPI (Cloudflare Container) ── PostgreSQL (jobs, documents, questions, budget ledger)
              │                            └─ R2 (S3 API): originals, page renders, figure crops
              └─ in-process job worker (Postgres SKIP LOCKED queue)
                    └─ OCR engine ─► SoCLaaS vision model (budget reservation → call → reconcile)
```

- Business logic lives in service modules; HTTP routers only translate.
- Job queue: Postgres `jobs` table claimed with `FOR UPDATE SKIP LOCKED`. It is transactional with the
  document rows and needs no extra infrastructure. Cloudflare Queues is evaluated in Phase 7 behind the
  same `enqueue` interface (a Queue would only wake the container; Postgres stays the source of truth).
- Auth: anonymous guest accounts (opaque token, SHA-256 stored) created behind Turnstile; every
  document/question/job query is scoped by `owner_id`. Admin endpoints require a Cloudflare Access JWT
  (or a dev-only admin token outside production).

## 4. Cost controls (Phase 1)

- Model catalogue JSON: id, tier (`ocr`/`fast`/`reasoning`), capabilities, input/output price per
  1M tokens, currency. USD prices need an explicit `FX_USD_TO_SGD`.
- Every paid call: estimate worst case (input estimate + `max_tokens`) → **atomic reservation**
  (`UPDATE daily_budgets … WHERE spent+reserved+x <= ceiling`) → call → reconcile actual usage
  (missing usage ⇒ charge the reservation) → ledger row.
- Day boundary Asia/Singapore. Thresholds: ≥ SGD 7 warning, ≥ 9 restricted (only `ocr`/`fast` tiers,
  reduced `max_tokens`), ≥ 10 block. Per-user daily cap and per-user rate limits (Postgres counters).
- Stale reservations (crashed process) are settled at the reserved amount, never released.
- OCR cache keyed by page-image SHA-256 + pipeline version + model.

## 5. OCR pipeline (Phase 2)

1. Upload: size limit, magic-byte type detection (JPEG/PNG/WebP/PDF), decompression-bomb guard,
   page limit, encrypted-PDF rejection. Original stored by SHA-256.
2. Ingest: EXIF orientation fix, metadata strip, resize; PDF pages rendered with pypdfium2.
3. Page OCR: one structured vision call per page (JSON schema when the model supports it, always
   Pydantic-validated, one bounded repair attempt). Illegible notation must be wrapped in
   `\unclear{…}`, never guessed silently.
4. Segmentation: merge items continuing across pages, keep numbering and subparts, attach figure
   regions (cropped into assets).
5. Deterministic LaTeX normalization + validation (Unicode symbols → LaTeX, NFC Vietnamese, delimiter
   and brace balance, `\left/\right`, environments, command allow-list).
6. Preliminary topic classification (deterministic keyword scoring, multi-label → `mixed`), editable.
7. Review: every question starts `pending`; `flagged` with explicit reasons when there is `\unclear`,
   invalid LaTeX, low confidence, or a figure. The student edits LaTeX (live KaTeX preview), topics
   and subparts; `confirmed` is only allowed for valid LaTeX without `\unclear`. Optimistic
   concurrency via `version`.

## 6. Files

- `docker-compose.yml` (Postgres 17, MinIO for the S3/R2 code path), `.env.example`, `Makefile`.
- `services/api`: `app/{config,db,models,errors,logging_setup,main}.py`, `app/api/v1/*`,
  `app/security/*`, `app/providers/*`, `app/billing/*`, `app/storage/*`, `app/documents/*`,
  `app/ocr/*`, `app/classification/*`, `app/workers/*`, `migrations/`, `tests/`, `Dockerfile`,
  `scripts/soclaas_probe.py`.
- `apps/web`: App Router pages (dashboard, upload, document review, question workspace shell, usage,
  admin usage), gateway route handlers, KaTeX components, generated OpenAPI types, Playwright tests,
  vinext/wrangler config.
- `infra/cloudflare`: container Worker (`api-gateway`), wrangler configs, deployment notes.
- `docs/phases/PHASE_{1,2}_{SUMMARY,TESTING}.md`.

## 7. Acceptance criteria

- `pytest` passes against real Postgres (unit, integration, Hypothesis, concurrency, security).
- 50 concurrent reservations never exceed the ceiling; budget states switch at 7/9/10.
- Users cannot read or modify another user's documents/questions/jobs (tested).
- Upload → job → OCR → reviewable questions works end to end; a fixture OCR provider exists only for
  tests/E2E and is refused when `ENVIRONMENT=production`.
- Live OCR golden test runs when `SOCLAAS_API_KEY` is set.
- Web: `tsc` strict passes, `next build` passes, `vinext build` passes, Playwright E2E passes.
- No secrets in browser bundles (tested by grepping build output).
