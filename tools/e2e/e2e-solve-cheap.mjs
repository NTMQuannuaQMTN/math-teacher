// Solving with cost controls: one student solves a worksheet's algebra question (cheap model),
// then a second student with the same worksheet gets the stored lesson from the shared library.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures/17-worksheet-vi.jpg", import.meta.url).pathname;
const OUT = "shots-solve-cheap";
mkdirSync(OUT, { recursive: true });
const errors = [];
const ok = (m) => console.log("✓", m);
const browser = await chromium.launch();

async function student(name) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(FIX);
  await page.getByTestId("use-photo").click();
  await page.getByTestId("question-1").waitFor({ timeout: 60000 });
  await page.getByTestId("save-button").click();
  await page.getByText("Đã lưu", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText(/\+\d+ bài/).first().click();
  await page.getByTestId("solve-q1").waitFor({ timeout: 15000 });
  const t0 = Date.now();
  await page.getByTestId("solve-q1").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 180000 });
  const seconds = (Date.now() - t0) / 1000;
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}-lesson.png` });
  await page.locator('[data-testid^="reveal-"]').first().click();
  await page.getByTestId("toggle-solution").click();
  await page.getByTestId("final-answer").waitFor();
  await page.getByTestId("final-answer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/${name}-answer.png` });
  await context.close();
  return seconds;
}

try {
  const first = await student("student1");
  ok(`student 1 solved Bài 1 in ${first.toFixed(1)}s (hints, solution, final answer shown)`);
  const second = await student("student2");
  ok(`student 2 got the same problem's lesson in ${second.toFixed(1)}s (shared library)`);
} catch (err) {
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
if (errors.length) {
  console.error("Page errors:\n" + [...new Set(errors)].join("\n"));
  process.exitCode = 1;
}
await browser.close();
