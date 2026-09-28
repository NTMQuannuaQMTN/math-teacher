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
