# Architecture — Milestone 1: Image → OCR → Edit/Verify → Save

## Scope

This milestone is a reliable maths-problem **scanner**. It deliberately contains no solving,
answers, steps, tutoring, or learning data. Those belong to later milestones (see *Extending to
solving* below).

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
2. **Review / crop.** A draggable crop box; the image is re-encoded to JPEG, long side ≤ 2000 px.
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

## Extending to solving (next milestone)

- Add a `solutions` (or `analyses`) table keyed by `scan_id`, plus `POST /v1/scans/:id/solve`.
  Solving should read `problem_text`, the confirmed text, and never the raw OCR.
- Keep `OcrResult` and `Scan` unchanged; add a separate `Solution` schema to `shared/`.
- The `OcrProvider` pattern generalizes: add a `SolverProvider` interface rather than widening
  OCR.
