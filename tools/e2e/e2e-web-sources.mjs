// Web-only sources on Home: upload a document (image or multi-page PDF → page picker → crop screen)
// and screenshot a screen (browser display capture). No API calls: stops at the crop/review screen.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const PDF = process.env.PDF ?? new URL("../../tools/benchmark/samples/toan-kc.pdf", import.meta.url).pathname;
const IMG = new URL("../ocr-eval/fixtures/02-quadratic-vi.jpg", import.meta.url).pathname;
const OUT = "shots-web-sources";
mkdirSync(OUT, { recursive: true });
const errors = [];
const ok = (m) => console.log("✓", m);
const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--auto-accept-this-tab-capture", "--auto-select-tab-capture-source-by-title=Math"],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, locale: "vi-VN" });
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => { errors.push(`dialog: ${d.message()}`); void d.dismiss(); });

try {
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByTestId("upload-button").getByText("Tải tài liệu lên", { exact: false }).waitFor();
  await page.getByTestId("screenshot-button").getByText("Chụp màn hình").waitFor();
  await page.screenshot({ path: `${OUT}/1-home.png` });
  ok("Home on web shows 'Chụp màn hình' and 'Tải tài liệu lên (ảnh hoặc PDF)'");

  // Multi-page PDF → page picker → page 2 → crop screen.
  let chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(PDF);
  await page.getByTestId("pdf-page-2").waitFor({ timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid^="pdf-page-"] img').length >= 2, null, { timeout: 30000 });
  await page.screenshot({ path: `${OUT}/2-pdf-pages.png` });
  ok("2-page PDF opens the page picker with rendered previews");
  await page.getByTestId("pdf-page-2").click();
  await page.waitForURL(/\/review/, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/3-review-from-pdf.png` });
  ok("choosing page 2 goes to the crop screen");

  // Image upload → crop screen.
  await page.goto(APP, { waitUntil: "networkidle" });
  chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(IMG);
  await page.waitForURL(/\/review/, { timeout: 30000 });
  ok("an image upload goes straight to the crop screen");

  // Screen capture (may be unavailable in headless Chromium).
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByTestId("screenshot-button").click();
  const reached = await page.waitForURL(/\/review/, { timeout: 15000 }).then(() => true, () => false);
  await page.screenshot({ path: `${OUT}/4-after-screenshot.png` });
  if (reached) ok("screen capture grabbed a frame and opened the crop screen");
  else console.log("• screen capture could not be exercised in headless Chromium (needs a real display picker)");
} catch (err) {
  await page.screenshot({ path: `${OUT}/FAILURE.png` });
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
if (errors.length) console.log("page errors/dialogs:\n" + [...new Set(errors)].join("\n"));
await browser.close();
