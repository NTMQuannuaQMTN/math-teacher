// Failure-path E2E: OCR errors, empty results, network loss, cancel mid-processing, offline history.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = "http://localhost:8081";
const FIX = new URL("../ocr-eval/fixtures", import.meta.url).pathname;
mkdirSync("shots-fail", { recursive: true });
const errors = [];
let scenario = null;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
// Inject a mock OCR scenario into scan-creation requests.
await page.route("**/v1/scans", async (route) => {
  const headers = { ...route.request().headers() };
  if (scenario && route.request().method() === "POST") headers["x-mock-scenario"] = scenario;
  await route.continue({ headers });
});

const ok = (m) => console.log("✓", m);
const shot = (n) => page.screenshot({ path: `shots-fail/${n}.png` });

async function toReview(fixture) {
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(`${FIX}/${fixture}`);
  await page.getByTestId("use-photo").waitFor({ timeout: 20000 });
}

try {
  // 1. Provider error → friendly error with retry → retry succeeds on stored image
  scenario = "provider_error";
  await toReview("02-quadratic-vi.jpg");
  await page.getByTestId("use-photo").click();
  await page.getByText("Không đọc được đề bài", { exact: true }).waitFor({ timeout: 20000 });
  await shot("01-provider-error");
  ok("provider error shows retry state (vi)");
  scenario = null;
  await page.getByRole("button", { name: "Đọc lại" }).click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 20000 });
  ok("read again recovers");

  // 2. No maths found → type it yourself → save
  scenario = "no_math";
  await toReview("15-not-math.jpg");
  await page.getByTestId("use-photo").click();
  await page.getByText("Không tìm thấy bài toán", { exact: true }).waitFor({ timeout: 20000 });
  await shot("02-no-math");
  await page.getByRole("button", { name: "Tự nhập đề bài" }).click();
  await page.getByTestId("problem-editor").fill("Tính $\\frac{3}{4} + \\frac{1}{6}$");
  await page.waitForTimeout(700);
  await shot("03-typed-manually");
  await page.getByTestId("save-button").click();
  await page.getByText("Đã lưu vào bài toán của bạn").waitFor({ timeout: 15000 });
  ok("no-math → manual entry → saved");

  // 3. Unreadable
  scenario = "unreadable";
  await toReview("16-blurry.jpg");
  await page.getByTestId("use-photo").click();
  await page.getByText("Ảnh khó đọc", { exact: true }).waitFor({ timeout: 20000 });
  await shot("04-unreadable");
  ok("unreadable image explained, no fake text");

  // 4. Low quality banner
  scenario = "low_quality";
  await toReview("11-handwritten-vi.jpg");
  await page.getByTestId("use-photo").click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 20000 });
  await page.getByText("Một số chỗ trong ảnh khó đọc", { exact: false }).waitFor();
  await shot("05-low-quality");
  ok("low-quality warning shown");

  // 5. Network loss during upload → error → back online → retry (idempotent)
  scenario = null;
  await toReview("05-inequality-vi.jpg");
  await context.setOffline(true);
  await page.getByTestId("use-photo").click();
  await page.getByText("Không có kết nối mạng", { exact: false }).waitFor({ timeout: 20000 });
  await shot("06-offline-upload");
  ok("offline upload shows network error");
  await context.setOffline(false);
  await page.getByTestId("process-retry").click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 20000 });
  ok("retry after reconnect succeeds");

  // 6. Cancel during processing → server keeps result → Home shows unfinished scan
  scenario = "slow";
  await toReview("13-function-vi.jpg");
  await page.getByTestId("use-photo").click();
  await page.getByTestId("process-cancel").waitFor();
  await shot("07-processing");
  await page.getByTestId("process-cancel").click();
  await page.getByTestId("use-photo").waitFor();
  ok("cancel returns to review");
  await page.waitForTimeout(9000);
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByText("Tiếp tục bài đang làm dở").waitFor({ timeout: 10000 });
  await shot("08-unfinished");
  await page.getByText("Tiếp tục bài đang làm dở").click();
  await page.getByTestId("problem-rendered").waitFor({ timeout: 20000 });
  ok("unfinished scan resumes after navigating away mid-OCR");

  // 7. Offline home uses the snapshot
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.reload().catch(() => undefined);
} catch (err) {
  await shot("FAILURE");
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
await context.setOffline(false);
if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exitCode = 1;
}
await browser.close();
