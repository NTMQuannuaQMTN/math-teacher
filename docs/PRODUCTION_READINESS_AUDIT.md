# Production readiness audit

Date: 2026-10-01 · Branch `sprint/model-research` · Scope: the Math Teacher app (Expo) + Cloudflare Worker +
solver, as a tutor for Vietnamese Grade 9 students preparing for Toán (chuyên) vào 10.

Scores use only implemented, tested or measured evidence. Plans and untested features score nothing.
0–2 missing or broken · 3–4 early with major gaps · 5–6 functional but incomplete or unreliable ·
7–8 strong, limited known gaps · 9 production-quality evidence · 10 exceptional.

## 1. Scores

| Dimension | Weight | Score | Weighted |
|---|---:|---:|---:|
| Mathematical correctness and verification | 20% | 6 | 1.20 |
| Curriculum and teaching quality | 15% | 5 | 0.75 |
| Dataset quality and coverage | 10% | 5 | 0.50 |
| Model reliability and generalisation | 15% | 3 | 0.45 |
| Latency and performance | 10% | 4 | 0.40 |
| Backend architecture and scalability | 10% | 6 | 0.60 |
| Security and privacy | 10% | 5 | 0.50 |
| Frontend usability and accessibility | 5% | 6 | 0.30 |
| Monitoring, testing and maintainability | 5% | 5 | 0.25 |
| **Total** | | | **4.95 / 10** |

**Classification: Internal testing.** The weighted score sits at the "functional but incomplete" boundary,
and the critical blockers (§3) independently rule out a beta: there is no budgeted production inference
path, and accuracy of the served model on held-out chuyên papers is not established.

## 2. Evidence per dimension

### Mathematical correctness and verification: 6
- **Evidence:**
  - A deterministic verifier with answer checks (substitute, identity, inequality, value, brute-force
    integers), figure construction, claim measurement, statement-given checks and restatement detection.
  - 297 worker tests.
  - CRITICAL (wrong but shown as verified) is 0 in every benchmark run after the restatement fix. That fix
    came from finding one CRITICAL: Câu 2, 10√2 "verified".
  - Ground truth of both datasets checked by computation: 47/47 v1, 43/43 chuyên.
- **Gaps:**
  - Proofs without a figure (number theory, combinatorics, games) can only be "not checked".
  - The served model's accuracy on held-out chuyên papers is not measured (docs/CURRENT_SOLVER_EVALUATION.md).
- **To raise:** run the held-out evaluation with the served model; add checks for proof sub-claims
  (e.g. numeric instances of number-theory claims).

### Curriculum and teaching quality: 5
- **Evidence:**
  - The curriculum is aligned with the 13 entrance-exam topics.
  - Per-topic method policy; Grade 9 checker (forbidden methods retried, grey zone advisory).
  - Hint-first lesson design; "Dạng bài" row; method cards from the knowledge map.
  - Rubric results: Nemotron 7/9 suitable, local Qwen 9/11 (baseline_results.json).
  - Manual review of 5 lessons found the methods are school-level.
- **Gaps:**
  - The free model's Vietnamese is not fluent (Chinese, English or Portuguese insertions are patched or retried).
  - No teacher has reviewed any lesson.
  - Grade-level checks are keyword-based.
- **To raise:** teacher review of 20–30 lessons; a model with better Vietnamese.

### Dataset quality and coverage: 5
- **Evidence:**
  - 7 real papers from 4 boards, 2023–2026, 72 problems.
  - Provenance with SHA-256; every answer independently checked; errors in the official keys documented.
  - Knowledge profiles and taxonomy; exam-level splits; 22 verified teaching records; plus dataset v1 (40).
- **Gaps:**
  - Small (one region-year per board except PTNK).
  - Transcriptions and annotations not proofread by a person.
  - 23 proof records only manually reviewed; no statistics, probability or solid-geometry depth.
- **To raise:** +3 schools × 3 years; teacher proofreading.

### Model reliability and generalisation: 3
- **Evidence:**
  - The served model is a free hosted model: about 50 requests/day, exhausted in one afternoon of testing.
  - Truncation on hard proofs (ch-4).
  - Mixed-language output.
  - Failover to local exists but is 4–20 min per problem on this laptop.
  - Generalisation to unseen boards measured only on a few local runs (docs/GENERALIZATION_EVALUATION.md).
- **Gap:** no reliable, budgeted model.
- **To raise:** an authorised paid open-model endpoint (≈ $1–2 per 1,000 problems) or a stronger free tier;
  measure on the held-out test.

### Latency and performance: 4
- **Evidence:**
  - Hosted: median 46 s and P90 113 s on validation; real exam solves 22–362 s.
  - Streaming progress shows the problem type and plan early (OPT-004).
  - Retry budget and effort step-down bound the worst case.
  - Local is 4–20 min per problem.
  - OCR 1–3 s per photo locally.
- **Gap:** a minute or more of waiting for hard problems; free-tier queueing.
- **To raise:** a paid endpoint with faster throughput; pre-solved library for known exam problems.

### Backend architecture and scalability: 6
- **Evidence:**
  - Cloudflare Workers + D1 + R2.
  - Idempotent scan creation, per-question solve lock, 409/202 polling.
  - Migrations; cron cleanup; shared lesson library; failover.
  - The save path is independent of optional schema (migration 0005).
- **Gaps:**
  - The inference provider is the scaling limit.
  - OCR depends on a local server (not deployable on Workers).
  - No queue for long solves (`waitUntil` + polling).
- **To raise:** a hosted OCR/solver endpoint; a queue for long jobs.

### Security and privacy: 5
- **Evidence:**
  - Device-token isolation (hashed; owner-scoped queries); per-device and per-IP rate limits.
  - Upload validation; HMAC-signed expiring image URLs.
  - Secrets only in `.dev.vars` or Cloudflare secrets, never in the client.
  - Prompt-injection framing; security tests.
- **Gaps:**
  - Anonymous identity only (lost device = lost history).
  - Problem text goes to a third-party free endpoint without an in-app notice.
  - No privacy policy or data-retention statement for minors' data.
  - CORS origins not yet configured in production.
- **To raise:** an in-app disclosure plus a privacy policy; production CORS; an account option.

### Frontend usability and accessibility: 6
- **Evidence:**
  - Camera, upload, screenshot and PDF sources; review and edit with a maths keyboard; KaTeX rendering.
  - Hint-first lesson, interactive figure, Vietnamese and English, light and dark.
  - Live regions on the loading screen; 10 web e2e scripts.
- **Gaps:**
  - No physical-device test of camera framing (TASKS.md).
  - No accessibility audit (screen reader, contrast, maths alternatives).
- **To raise:** device testing; an accessibility pass.

### Monitoring, testing and maintainability: 5
- **Evidence:**
  - 297 tests; typecheck and lint clean.
  - Benchmarks with caching and offline replay; structured solve logs; experiment logs.
- **Gaps:**
  - No CI, no error tracking, no alerting, no dashboards.
  - Overlapping status docs; many one-off scripts.
- **To raise:** CI (`npm run check` + offline benchmark replay); error tracking; a solve-latency and
  failure dashboard from D1.

## 3. Production readiness gates

| Gate | Status | Evidence |
|---|---|---|
| Working end-to-end journey | ✅ locally | scan → confirm → solve → lesson on the local worker (e2e, live tests today) |
| Reliable OCR for supported inputs | ⚠️ | 20/20 fixtures locally; production OCR host missing |
| Correct answers on a representative held-out benchmark | ❌ not established | hosted test split never run (quota); local runs n ≤ 10 |
| Curriculum-appropriate solutions | ⚠️ | checker + policy; no teacher review |
| Reliable geometry | ❌ for proofs | hard proofs truncate or fail verification |
| Useful hints | ⚠️ | rubric-checked structure; no user study |
| Acceptable latency | ⚠️ | 46 s median hosted; minutes for hard problems |
| Stable backend | ✅ | locks, idempotency, failure paths tested |
| Authentication / authorisation | ⚠️ | device isolation only |
| Secure secrets management | ✅ | keys only server-side |
| Privacy protections | ❌ | no disclosure that problem text goes to a third party; no policy |
| Error handling | ✅ | typed errors, quota/timeout/malformed paths, failed regenerate keeps the lesson |
| Rate limiting / abuse protection | ✅ | per device and per IP |
| Logging and monitoring | ⚠️ / ❌ | logs yes; monitoring and alerting no |
| Automated tests | ✅ (no CI) | 297 tests run by hand |
| Deployment and rollback procedure | ❌ | `wrangler deploy` only; no documented rollback, no staging |
| Operating and maintenance process | ❌ | none documented |

## 4. Critical blockers

1. **No production inference within budget.** The free tier can't serve users; Gemini is disabled; paid
   use needs authorisation.
2. **Unmeasured held-out accuracy** of the served model on chuyên papers.
3. **Privacy:** minors' problem text is sent to a third-party free endpoint without disclosure.
4. **No monitoring or rollback procedure.**

## 5. Non-critical gaps

- Hard geometry proofs.
- Free model's Vietnamese.
- Production OCR host.
- Accounts.
- Accessibility audit.
- CI.
- Documentation consolidation.

## 6. Recommended release scope

Internal testing with a small group (the developer, a teacher reviewer), on the local worker with a free or
authorised paid endpoint. Limit it to algebra, number theory and geometry *calculation* problems, where
answers are machine-checked. Label proof lessons "chưa kiểm chứng".

## 7. Prioritised remediation roadmap

1. **Choose and authorise the production solver endpoint** (open model, paid, about $1–2 per 1,000 problems)
   and run the held-out chuyên test split with it: unblocks gates 3 and 4 and the latency gate.
2. **Privacy:** in-app notice and a policy; data retention for confirmed problems; production CORS.
3. **Monitoring:** error tracking plus a daily D1 report (solve count, failure codes, P50/P90 duration,
   CRITICAL candidates flagged by users); CI running `npm run check` and an offline benchmark replay.
4. **Teacher review loop:** proofread transcriptions, review 30 lessons, calibrate the rubric.
5. **Production OCR:** host PaddleOCR-VL (or a paid OCR) behind the worker.
6. **Geometry proofs:** stronger-model fallback for proof tier only; pre-solved verified library for
   published exam problems.
7. **Deployment procedure:** staging environment, `wrangler rollback` runbook, migration checklist.
