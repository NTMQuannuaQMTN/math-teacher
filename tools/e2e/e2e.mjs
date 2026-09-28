// Web E2E of the full scan flow against Expo web + wrangler dev (mock OCR).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures", import.meta.url).pathname;
const OUT = "shots";
mkdirSync(OUT, { recursive: true });
const locale = process.env.LOCALE ?? "en-US";
const vi = locale.startsWith("vi");
const T = vi
  ? { upload: "Tải ảnh lên", read: "Đọc bài toán này", edit: "Sửa", save: "Lưu bài toán", saved: "Đã lưu vào bài toán của bạn", scan: "Chụp bài toán", allow: "Cho phép máy ảnh", denied: "Quyền máy ảnh", recent: "Bài toán gần đây" }
  : { upload: "Upload from photos", read: "Read this problem", edit: "Edit", save: "Save problem", saved: "Saved to your problems", scan: "Scan a problem", allow: "Allow camera", denied: "Camera access", recent: "Recent problems" };

let step = 0;
const errors = [];
async function shot(page, name) {
  step += 1;
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${String(step).padStart(2, "0")}-${vi ? "vi-" : ""}${name}.png` });
}
function ok(label) {
  console.log("✓", label);
}

const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-video-capture=${new URL("fakecam.mjpeg", import.meta.url).pathname}`,
  ],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale, permissions: ["camera"] });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());

try {
  // ---------- Upload flow ----------
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByText(T.recent).waitFor();
  await shot(page, "home-empty");

  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(`${FIX}/03-fraction-vi.jpg`);
  await page.getByTestId("use-photo").waitFor({ timeout: 20000 });
  await shot(page, "review-upload");
  ok("upload → review");

  await page.getByTestId("use-photo").click();
  await shot(page, "processing");
  await page.getByTestId("problem-rendered").waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  await shot(page, "result");
  ok("review → OCR → result");

  await page.getByTestId("edit-button").click();
  const editor = page.getByTestId("problem-editor");
  await editor.waitFor();
  await editor.click();
  await editor.press("Meta+ArrowDown");
  await editor.type(" Tính $P$ khi $x = 4$. ");
  // Deliberately leave an unclosed $ to check the markup warning, then fix it.
  await editor.type("$x");
  await page.waitForTimeout(600);
  if (!(await page.getByText(vi ? "Một số công thức" : "Some maths may not display", { exact: false }).count())) throw new Error("markup warning missing");
  await editor.type("$ ");
  await page.getByLabel("square root").click();
  await editor.type("9");
  await page.waitForTimeout(700);
  await shot(page, "editing");
  const edited = await editor.inputValue();
  if (!edited.includes("\\sqrt{9}")) throw new Error(`symbol insert failed: ${edited}`);
  ok("edit + symbol bar inserts $\\sqrt{}$ with cursor inside");

  await page.getByTestId("save-button").click();
  await page.getByText(T.saved).waitFor({ timeout: 15000 });
  await page.getByTestId("saved-problem").waitFor();
  await shot(page, "saved-problem");
  ok("save → problem detail");

  // ---------- Camera flow ----------
  await page.getByTestId("scan-another").click();
  await page.getByTestId("shutter").waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
  await shot(page, "camera");
  await page.getByTestId("shutter").click();
  await page.getByTestId("use-photo").waitFor({ timeout: 20000 });
  await shot(page, "review-camera-autocrop");
  ok("camera capture → review with guide-frame crop");
  await page.getByTestId("use-photo").click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  await shot(page, "result-camera");
  await page.getByTestId("save-button").click();
  await page.getByText(T.saved).waitFor({ timeout: 15000 });
  ok("camera → OCR → save");

  // ---------- Home + history ----------
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByText(T.recent).waitFor();
  await page.waitForTimeout(1500);
  await shot(page, "home-with-history");
  const cards = await page.getByLabel(vi ? "Mở bài toán" : "Open problem", { exact: false }).count();
  if (cards < 2) throw new Error(`expected ≥2 recent problems, got ${cards}`);
  ok(`home lists ${cards} recent problems`);
  await page.getByLabel(vi ? "Mở bài toán" : "Open problem", { exact: false }).first().click();
  await page.getByTestId("saved-problem").waitFor();
  await shot(page, "open-from-history");
  ok("open saved problem from home");

  await page.goto(`${APP}/history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "history");
  ok("history screen");
} catch (err) {
  await shot(page, "FAILURE");
  console.error("✗", err.message);
  process.exitCode = 1;
}

// ---------- Camera permission denied ----------
const denied = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale });
const p2 = await denied.newPage();
p2.on("pageerror", (e) => errors.push(e.message));
try {
  await p2.goto(`${APP}/camera`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(3000);
  await p2.screenshot({ path: `${OUT}/${vi ? "vi-" : ""}camera-permission.png` });
  ok("camera permission screen renders without crash");
  const allow = p2.getByTestId("allow-camera");
  if (await allow.count()) {
    await allow.click();
    await p2.waitForTimeout(2500);
    await p2.screenshot({ path: `${OUT}/${vi ? "vi-" : ""}camera-after-deny.png` });
    ok("permission request handled (denied in headless)");
  }
} catch (err) {
  console.error("✗ permission", err.message);
  process.exitCode = 1;
}

if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exitCode = 1;
}
await browser.close();
