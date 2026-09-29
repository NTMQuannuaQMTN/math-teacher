// Multi-question flow: upload a worksheet → split into questions → keep some → save → solve each question.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures/17-worksheet-vi.jpg", import.meta.url).pathname;
const OUT = "shots-worksheet";
mkdirSync(OUT, { recursive: true });
const errors = [];
let n = 0;
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png`, fullPage: full });
const ok = (m) => console.log("✓", m);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/status of 409/.test(m.text()) && errors.push(`console: ${m.text().slice(0, 200)}`));
page.on("dialog", (d) => d.accept());

try {
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(FIX);
  await page.getByTestId("use-photo").click();
  await page.getByTestId("question-1").waitFor({ timeout: 60000 });
  await page.waitForTimeout(1200);
  await shot(page, "questions-found");
  const found = await page.locator('[data-testid^="question-toggle-"]').count();
  if (found < 2) throw new Error(`expected several questions, found ${found}`);
  ok(`photo split into ${found} questions`);

  await page.getByTestId(`question-toggle-${found}`).click();
  await page.getByTestId("save-button").getByText(`Lưu ${found - 1} bài`).waitFor();
  await page.getByTestId(`question-${found}`).scrollIntoViewIfNeeded();
  await shot(page, "last-unticked");
  ok(`unticking a question → "Lưu ${found - 1} bài"`);

  await page.getByTestId("question-edit-1").click();
  await page.getByTestId("question-editor-1").waitFor();
  await shot(page, "editing-question-1");
  await page.getByText("Sửa xong").first().click();
  ok("each question can be edited on its own");

  await page.getByTestId("save-button").click();
  await page.getByTestId("solve-q2").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);
  await shot(page, "saved-questions");
  const solveButtons = await page.locator('[data-testid^="solve-q"]').count();
  if (solveButtons !== found - 1) throw new Error(`expected ${found - 1} solve buttons, got ${solveButtons}`);
  ok(`saved screen lists ${solveButtons} questions, each with its own Solve button`);

  let t0 = Date.now();
  await page.getByTestId("solve-q2").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 240000 });
  await page.waitForTimeout(1500);
  await shot(page, "lesson-q2");
  const q2Text = await page.getByTestId("lesson-problem").innerText();
  if (!/Bài 2|tam giác/i.test(q2Text)) throw new Error(`question 2 lesson shows the wrong problem: ${q2Text.slice(0, 80)}`);
  ok(`question 2 lesson ready in ${((Date.now() - t0) / 1000).toFixed(0)}s (${(await page.getByRole("img", { name: /Hình vẽ/ }).count()) ? "with figure" : "no figure"})`);

  await page.goBack();
  t0 = Date.now();
  await page.getByTestId("solve-q1").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 240000 });
  await page.waitForTimeout(1000);
  const q1Text = await page.getByTestId("lesson-problem").innerText();
  if (!/Bài 1|phương trình/i.test(q1Text)) throw new Error(`question 1 lesson shows the wrong problem: ${q1Text.slice(0, 80)}`);
  await shot(page, "lesson-q1");
  ok(`question 1 has its own lesson (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByText(/\+\d+ bài/).first().waitFor({ timeout: 10000 });
  await shot(page, "home-badge");
  ok("home shows the photo with a '+N bài' badge");
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
