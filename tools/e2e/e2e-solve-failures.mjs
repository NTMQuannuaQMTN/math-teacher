// Solve failure paths through the UI. Redirects the app's API calls to a mock worker
// (SOLVER_PROVIDER=mock on MOCK_API, default :8788) and injects X-Mock-Scenario.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const MOCK_API = process.env.MOCK_API ?? "http://localhost:8788";
const FIX = new URL("../ocr-eval/fixtures/02-quadratic-vi.jpg", import.meta.url).pathname;
mkdirSync("shots-solve-fail", { recursive: true });
const errors = [];
let solveScenario = null;
const ok = (m) => console.log("✓", m);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
await page.route(/:8787\//, async (route) => {
  const req = route.request();
  const url = req.url().replace(/^http:\/\/[^/]+:8787/, MOCK_API);
  const headers = { ...req.headers() };
  if (solveScenario && req.method() === "POST" && /\/solve$/.test(url)) headers["x-mock-scenario"] = solveScenario;
  await route.continue({ url, headers });
});

async function savedProblem(text) {
  await page.goto(APP, { waitUntil: "networkidle" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("upload-button").click();
  await (await chooser).setFiles(FIX);
  await page.getByTestId("use-photo").click();
  await page.getByTestId("edit-button").waitFor({ timeout: 30000 });
  await page.getByTestId("edit-button").click();
  await page.getByTestId("problem-editor").fill(text);
  await page.getByTestId("save-button").click();
  await page.getByTestId("solve-button").waitFor();
}

try {
  // Saving prefetches the lesson in the background, so scenarios are set before saving.
  // 1. Provider failure → useful error → retry works
  solveScenario = "solve_provider_error";
  await savedProblem("Giải phương trình $x^{2} - 5x + 6 = 0$.");
  await page.waitForTimeout(2500);
  await page.getByTestId("solve-button").click();
  await page.getByTestId("solve-retry").waitFor({ timeout: 20000 });
  await page.screenshot({ path: "shots-solve-fail/01-provider-error.png" });
  ok("provider failure shows an error with retry");
  solveScenario = null;
  await page.getByTestId("solve-retry").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 20000 });
  ok("retry loads the lesson");

  // 2. Unverified answer → clear warning, not a checkmark
  solveScenario = "solve_unverified";
  await savedProblem("Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 40^{\\circ}$. Tính $\\widehat{B}$.");
  await page.getByTestId("solve-button").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 20000 });
  await page.getByTestId("toggle-solution").click();
  await page.getByText("Chưa kiểm chứng được").waitFor();
  await page.getByTestId("final-answer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "shots-solve-fail/02-unverified.png" });
  ok("unverified lesson is clearly marked");

  // 3. Leave while solving → come back → lesson appears (no duplicate solve)
  solveScenario = "solve_slow";
  await savedProblem("Giải phương trình $x^{2} - 5x + 6 = 0$ (bài 3).");
  await page.getByTestId("solve-button").click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "shots-solve-fail/03-solving.png" });
  await page.goBack();
  solveScenario = null;
  await page.waitForTimeout(1500);
  await page.getByTestId("solve-button").click();
  await page.getByTestId("lesson-problem").waitFor({ timeout: 40000 });
  ok("leaving mid-solve and returning shows the finished lesson");
} catch (err) {
  await page.screenshot({ path: "shots-solve-fail/FAILURE.png" });
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
if (errors.length) {
  console.error("Page errors:\n" + [...new Set(errors)].join("\n"));
  process.exitCode = 1;
}
await browser.close();
