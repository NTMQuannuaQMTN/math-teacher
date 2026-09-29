// Drags every draggable (blue) point of stored lessons in the web build and screenshots before/after.
// Needs lesson JSON served with CORS (see tools/e2e/README.md) and Metro on :8081.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const APP = process.env.APP_URL ?? "http://localhost:8081";
const SRC = process.env.LESSONS_URL ?? "http://127.0.0.1:8799";
const lessons = (process.env.LESSONS ?? "g8-construction-vi,g4-congruent-vi,g9-tangent-vi").split(",");
mkdirSync("shots-drag", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const name of lessons) {
  await page.goto(`${APP}/dev/lesson?src=${encodeURIComponent(`${SRC}/${name}.json`)}`, { waitUntil: "networkidle" });
  await page.getByTestId("lesson-problem").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots-drag/${name}-0-before.png`, clip: { x: 0, y: 0, width: 390, height: 440 } });
  const handles = page.locator('svg circle[r="6"]');
  const count = await handles.count();
  for (let i = 0; i < count; i++) {
    const box = await handles.nth(i).boundingBox();
    if (!box) continue;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (i % 2 ? -45 : 55), y + (i % 2 ? 35 : -30), { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `shots-drag/${name}-1-after.png`, clip: { x: 0, y: 0, width: 390, height: 440 } });
  console.log(`✓ ${name}: dragged ${count} point(s)`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
await browser.close();
