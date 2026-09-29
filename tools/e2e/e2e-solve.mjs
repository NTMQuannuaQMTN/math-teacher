// Web E2E of the solving flow: scan → save → solve → hints → figure interaction → solution.
// Works with the real solver (slow, costs a little) or SOLVER_PROVIDER=mock.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures", import.meta.url).pathname;
const FIXTURE = process.env.FIXTURE ?? "09-geometry-vi.jpg";
const OUT = process.env.OUT ?? "shots-solve";
mkdirSync(OUT, { recursive: true });
const errors = [];
let n = 0;
const shot = async (page, name) => page.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png` });
const ok = (m) => console.log("✓", m);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/status of 409/.test(m.text()) && errors.push(`console: ${m.text().slice(0, 300)}`));
page.on("dialog", (d) => d.accept());

try {
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(`${FIX}/${FIXTURE}`);
  await page.getByTestId("use-photo").click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 60000 });
  await page.getByTestId("save-button").click();
  await page.getByTestId("solve-button").waitFor({ timeout: 15000 });
  await shot(page, "problem-saved");
  ok("scan saved");

  const started = Date.now();
  await page.getByTestId("solve-button").click();
  await page.waitForTimeout(1500);
  await shot(page, "solving");
  await page.getByTestId("lesson-problem").waitFor({ timeout: 240000 });
  await page.waitForTimeout(1500);
  ok(`lesson ready in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  await shot(page, "lesson");

  const hasFigure = (await page.getByLabel(/Hình vẽ|Figure/).count()) > 0;
  const hint = page.locator('[data-testid^="reveal-"]').first();
  await hint.click();
  await page.waitForTimeout(800);
  await shot(page, "hint1-revealed");
  ok("hint 1 revealed");

  if (await page.getByTestId("next-hint").count()) {
    await page.getByTestId("next-hint").click();
    await page.waitForTimeout(600);
    await shot(page, "hint2-question");
    await page.locator('[data-testid^="reveal-"]').first().click();
    await page.waitForTimeout(800);
    await shot(page, "hint2-revealed");
    ok("hint 2 unlocked and revealed");
  }

  if (hasFigure) {
    const fig = page.getByRole("img", { name: /Hình vẽ|Figure/ }).first();
    const box = await fig.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(400);
    await shot(page, "figure-zoomed");
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 30, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await shot(page, "figure-panned");
    await page.getByRole("button", { name: /^(Đặt lại|Reset view)$/ }).click();
    await page.waitForTimeout(300);
    // Tap around the figure until something gets selected.
    let selected = false;
    for (const [fx, fy] of [[0.5, 0.75], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.25, 0.75], [0.75, 0.75]]) {
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(250);
      if ((await page.getByText(/^(∠|[A-Z]{2}|\()/).count()) > 0) {
        selected = true;
        break;
      }
    }
    await shot(page, "figure-selected");
    ok(selected ? "tapping the figure selects an object" : "no object selected by taps (check screenshot)");
  }

  await page.getByTestId("toggle-solution").click();
  await page.getByTestId("final-answer").waitFor();
  await page.waitForTimeout(1200);
  await shot(page, "solution");
  const steps = page.locator('[data-testid^="step-"]');
  const count = await steps.count();
  if (count > 1) {
    await steps.nth(1).click();
    await page.waitForTimeout(500);
    await shot(page, "step2-active");
  }
  await page.getByTestId("final-answer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await shot(page, "final-answer");
  ok(`solution with ${count} steps and final answer`);

  // Leaving and coming back must not re-solve.
  await page.goBack();
  await page.getByTestId("solve-button").click();
  const t0 = Date.now();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 10000 });
  ok(`reopened lesson from cache in ${Date.now() - t0}ms`);
} catch (err) {
  await shot(page, "FAILURE");
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
if (errors.length) {
  console.error("Page errors:\n" + [...new Set(errors)].join("\n"));
  process.exitCode = 1;
}
await browser.close();
