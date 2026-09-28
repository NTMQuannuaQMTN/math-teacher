# Math Teacher: Milestone 1 (maths problem scanner)

The long-term goal is an AI mathematics teacher for Vietnamese secondary-school students (Grade 9
first). This repository currently implements only the **first milestone**: a reliable,
camera-first scanner that turns a photo of a maths problem into verified, well-formatted text.

```
Photo (camera or library) → crop → OCR → student checks & edits → save → history
```

Solving, explanations, and tutoring are deliberately **not** built yet (see [Roadmap](#roadmap)).

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
| User accounts, solving, tutoring | ⏳ planned (later milestones) |

## Repository layout

```
mobile/        Expo SDK 57 app (React Native, TypeScript, expo-router)
  src/app/       screens: index (home), camera, review, process, scan/[id], problem/[id], history
  src/api/       typed API client + error mapping
  src/components math renderer (KaTeX), crop box, symbol bar, shared UI
  src/lib/       image preparation, picker, device token, config
worker/        Cloudflare Worker API (TypeScript), D1 + R2
  src/ocr/       OcrProvider interface, providers, prompt, output normalization
  src/routes/    scans + signed images
  migrations/    D1 schema
  test/          unit tests (vitest);  scripts/smoke.mjs: API end-to-end test
shared/        API contract (Zod schemas) + maths-text utilities, used by both sides
tools/ocr-eval/  OCR test set (16 synthetic images across categories) + evaluation harness
tools/e2e/       Playwright end-to-end tests of the web build (happy path + failure paths)
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
| `OPENAI_MODEL` / `ANTHROPIC_MODEL` | model ids | `gpt-4.1` / `claude-opus-5` |
| `OCR_TIMEOUT_MS` | hard timeout per OCR call | `45000` |
| `OCR_LIMIT_PER_DEVICE_PER_HOUR` / `OCR_LIMIT_PER_IP_PER_HOUR` | abuse limits | `40` / `120` |
| `DRAFT_RETENTION_DAYS` | unconfirmed scans older than this are deleted nightly | `7` |
| `ALLOWED_ORIGINS` | CORS origins (only needed for Expo web) | empty |
| `IMAGE_URL_SECRET` (secret) | HMAC key for signed image URLs, 32+ random chars | **required** |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (secret) | key for the selected provider | — |

**Mobile:** `EXPO_PUBLIC_API_URL` is the Worker URL. It is required for production builds and
optional in development. It is not a secret; no keys ever ship in the app.

## OCR pipeline

1. **Client.** Crop to the problem, then re-encode as JPEG with the long side ≤ 2000 px (typically
   200–600 KB). This fixes EXIF orientation and HEIC.
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

## Database & storage

- **D1 `scans`**: one row per scanned image, holding owner, status (`draft` → `confirmed`), image
  metadata, the latest OCR result (JSON), attempts, the confirmed text, and timestamps.
- **D1 `rate_limits`**: fixed-window counters.
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
2. **Milestone 2.** OCR → understand the problem → solve. This will be a new `solutions` resource
   keyed by `scan_id` that reads the student-confirmed text.
3. **Later.** Structured maths representation → step-by-step teaching → interactive tutoring →
   personalized curriculum.
