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
- `e2e-drag.mjs`: opens stored lessons in the dev route `/dev/lesson` and drags every draggable
  point, taking before/after screenshots. The lesson JSON must be served with CORS
  (`LESSONS_URL`, default `http://127.0.0.1:8799`).
- `e2e-drag-constraints.mjs`: drags each vertex of a right isosceles triangle whose vertices are
  all free (givens AB ⊥ AC, AB = AC). It checks from the on-screen handles that the triangle stays
  right and isosceles. Serve the lesson JSON like `e2e-drag.mjs` (`LESSON`, default `right-iso.json`).
- `e2e-web-sources.mjs`: web-only Home buttons. It checks "Chụp màn hình" and "Tải tài liệu lên", a
  2-page PDF opening the page picker and then the crop screen, and an image upload going to the crop
  screen. Screen capture needs the browser's own picker, so it is only reported (test it by hand).
- `e2e-worksheet.mjs`: uploads a worksheet photo, checks that it splits into questions, skips
  one, saves, and solves two questions separately. Uses the real OCR and solver.
- `e2e-check-screen.mjs`: deletes a single question, saves and returns Home, then deletes a whole
  scan from the check screen. Real OCR, about $0.005.
- `e2e-solve-cheap.mjs`: student 1 solves a worksheet question on the cheap model; student 2
  solving the same problem gets the lesson from the shared library (no AI call). About $0.01.
