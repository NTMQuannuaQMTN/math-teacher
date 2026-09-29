// Dragging keeps the problem's givens: a right isosceles triangle (AB ⊥ AC, AB = AC, all vertices free)
// must stay right and isosceles whichever vertex is dragged. Measures the on-screen handles after each drag.
// Needs Metro on :8081 and a lesson JSON with such a figure served with CORS (LESSONS_URL, LESSON).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const APP = process.env.APP_URL ?? "http://localhost:8081";
const SRC = `${process.env.LESSONS_URL ?? "http://127.0.0.1:8799"}/${process.env.LESSON ?? "right-iso.json"}`;
const OUT = "shots-drag-constraints";
mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "vi-VN" });
page.on("pageerror", (e) => errors.push(e.message));

const handles = page.locator('svg circle[r="6"]');
const centers = async () => {
  const out = [];
  for (let i = 0; i < (await handles.count()); i++) {
    const b = await handles.nth(i).boundingBox();
    out.push({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  }
  return out;
};
// Is some vertex a right angle with equal legs? (Screen space: same shape up to scale and a flip.)
const rightIsosceles = (p) => {
  let best = { cos: 1, ratio: 0 };
  for (let v = 0; v < 3; v++) {
    const [a, b] = [p[(v + 1) % 3], p[(v + 2) % 3]];
    const u = { x: a.x - p[v].x, y: a.y - p[v].y };
    const w = { x: b.x - p[v].x, y: b.y - p[v].y };
    const lu = Math.hypot(u.x, u.y);
    const lw = Math.hypot(w.x, w.y);
    const cos = Math.abs(u.x * w.x + u.y * w.y) / (lu * lw);
    if (cos < best.cos) best = { cos, ratio: Math.min(lu, lw) / Math.max(lu, lw) };
  }
  return best;
};

try {
  await page.goto(`${APP}/dev/lesson?src=${encodeURIComponent(SRC)}`, { waitUntil: "networkidle" });
  await page.getByTestId("lesson-problem").waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/0-before.png`, clip: { x: 0, y: 0, width: 390, height: 440 } });
  const count = await handles.count();
  if (count !== 3) throw new Error(`expected 3 draggable vertices, found ${count}`);
  const moves = [[40, 25], [35, -30], [-45, -30]]; // inward, so the view does not re-fit (zoom out) after the drag
  for (let i = 0; i < count; i++) {
    const start = (await centers())[i];
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + moves[i][0], start.y + moves[i][1], { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await centers();
    const moved = Math.hypot(after[i].x - start.x, after[i].y - start.y);
    const shape = rightIsosceles(after);
    await page.screenshot({ path: `${OUT}/${i + 1}-after-drag-${i + 1}.png`, clip: { x: 0, y: 0, width: 390, height: 440 } });
    if (moved < 10) throw new Error(`vertex ${i + 1} didn't move (${moved.toFixed(1)}px)`);
    if (shape.cos > 0.03 || shape.ratio < 0.97) throw new Error(`givens broken after dragging vertex ${i + 1}: cos=${shape.cos.toFixed(3)} legs ratio=${shape.ratio.toFixed(3)}`);
    console.log(`✓ vertex ${i + 1} moved ${moved.toFixed(0)}px; still right (cos=${shape.cos.toFixed(3)}) and isosceles (legs ratio ${shape.ratio.toFixed(3)})`);
  }
  if (await page.getByText(/không còn đúng|no longer/i).count()) throw new Error("'givens broken' notice is showing");
  console.log("✓ no 'givens broken' notice");
} catch (err) {
  await page.screenshot({ path: `${OUT}/FAILURE.png` });
  console.error("✗", err.message.split("\n")[0]);
  process.exitCode = 1;
}
if (errors.length) {
  console.error("Page errors:\n" + [...new Set(errors)].join("\n"));
  process.exitCode = 1;
}
await browser.close();
