# Web end-to-end tests

Drive the Expo web build in headless Chrome against `wrangler dev` with the mock OCR provider.

```bash
npm run dev:worker            # repo root, with worker/.dev.vars from the example
npm run dev:mobile            # Metro on :8081 (serves the web build)
cd tools/e2e && npm install && npm run setup && npm run e2e
```

- `e2e.mjs`: upload flow, camera flow (Chrome fake camera), editing, save, home, and history.
  Set `LOCALE=vi-VN` for Vietnamese.
- `e2e-failures.mjs`: provider error with retry, no maths found, unreadable image, low quality,
  offline upload with retry, and cancelling mid-OCR then resuming.

Screenshots are written to `shots/` and `shots-fail/`.
