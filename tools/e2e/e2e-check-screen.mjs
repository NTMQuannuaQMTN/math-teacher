// Check screen: delete single questions, delete a whole scan, and return Home after saving/deleting.
// Uses real OCR (about $0.001 per photo with gpt-4.1-mini); no solving.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures/", import.meta.url).pathname;
const OUT = "shots-check";
mkdirSync(OUT, { recursive: true });
const errors = [];
let n = 0;
const shot = (page, name) => page.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png` });
const ok = (m) => console.log("✓", m);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());

async function scan(file) {
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(FIX + file);
  await page.getByTestId("use-photo").click();
}

try {
  // Worksheet: delete question 3, save, land on Home.
  await scan("17-worksheet-vi.jpg");
  await page.getByTestId("question-3").waitFor({ timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, "check-screen");
  await page.getByTestId("question-delete-3").click();
  await page.getByTestId("question-3").waitFor({ state: "detached" });
  await page.getByTestId("save-button").getByText("Lưu 2 bài").waitFor();
  await shot(page, "after-deleting-question-3");
  ok("Delete removes a single question (save button now says 'Lưu 2 bài')");

  await page.getByTestId("save-button").click();
  await page.getByText("Đã lưu 2 bài", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("scan-button").waitFor();
  await page.waitForTimeout(1200);
  await shot(page, "home-after-save");
  ok("saving returns to Home with a 'saved' notice");

  await page.getByText("+1 bài").first().click();
  await page.getByTestId("solve-q2").waitFor({ timeout: 15000 });
  const questions = await page.locator('[data-testid^="solve-q"]').count();
  if (questions !== 2) throw new Error(`expected 2 saved questions, got ${questions}`);
  ok("the saved photo holds the 2 remaining questions");

  // Single problem: delete the whole scan from the check screen.
  await scan("02-quadratic-vi.jpg");
  await page.getByTestId("delete-scan").waitFor({ timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, "single-problem-with-delete");
  await page.getByTestId("delete-scan").click();
  await page.getByText("Đã xóa ảnh").waitFor({ timeout: 15000 });
  await shot(page, "home-after-delete");
  ok("Delete on the check screen removes the scan and returns to Home");
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
