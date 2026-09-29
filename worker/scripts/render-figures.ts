/** Dev tool: renders every figure in a solver-eval result file to one HTML page (for visual QA). */
import { readFileSync, writeFileSync } from "node:fs";
import { buildScene } from "../../shared/src/figureScene";
import { figureBounds, fitTransform, resolveFigure } from "../../shared/src/geometry";
import type { Figure } from "../../shared/src/solution";

const [file, out = "/tmp/figures.html"] = process.argv.slice(2);
const data = JSON.parse(readFileSync(file!, "utf8"));
const cards: string[] = [];
for (const r of data.results) {
  const fig: Figure | null = r.lesson?.figure;
  if (!fig) continue;
  const W = 360, H = 260;
  const resolved = resolveFigure(fig);
  const bounds = figureBounds(resolved, new Set(fig.points.filter((p) => !p.hidden).map((p) => p.id)))!;
  const t = fitTransform(bounds, W, H, 40);
  const allShown = new Set(fig.lines.map((l) => l.id).concat(fig.circles.map((c) => c.id), fig.angles.map((a) => a.id)));
  const sc = buildScene(fig, resolved, t, { highlighted: new Set(), shownConstructions: allShown, showLabels: true });
  const el: string[] = [];
  for (const c of sc.circles) el.push(`<circle cx="${c.c.x}" cy="${c.c.y}" r="${c.r}" fill="none" stroke="#111" stroke-width="1.6" ${c.construction ? 'stroke-dasharray="6 5"' : ""}/>`);
  for (const a of sc.angles) el.push(`<path d="${a.path}" fill="none" stroke="#666" stroke-width="1.4"/>`);
  for (const l of sc.lines) el.push(`<line x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}" stroke="${l.construction ? "#888" : "#111"}" stroke-width="2" ${l.construction ? 'stroke-dasharray="7 5"' : ""}/>`);
  for (const m of sc.marks) el.push(`<path d="${m.path}" stroke="#111" fill="none" stroke-width="1.8"/>`);
  for (const a of sc.angles) if (a.label) el.push(`<text x="${a.labelAt.x}" y="${a.labelAt.y + 4}" font-size="12" text-anchor="middle" fill="#666">${a.label}</text>`);
  for (const l of sc.lines) if (l.label && l.labelAt) el.push(`<text x="${l.labelAt.x}" y="${l.labelAt.y + 4}" font-size="12" text-anchor="middle" fill="#666">${l.label}</text>`);
  for (const p of sc.points) el.push(`<circle cx="${p.p.x}" cy="${p.p.y}" r="4" fill="${p.draggable ? "#3563E9" : "#111"}"/><text x="${p.labelAt.x}" y="${p.labelAt.y + 5}" font-size="15" font-weight="700" font-style="italic" text-anchor="middle">${p.label}</text>`);
  cards.push(`<div class="c"><b>${r.id}</b> (${fig.scale}, ${resolved.errors.length} errors)<br><svg width="${W}" height="${H}">${el.join("")}</svg></div>`);
}
writeFileSync(out, `<html><body style="font-family:sans-serif;display:flex;flex-wrap:wrap;gap:8px;background:#f4f4f4">${cards.join("").replace(/<div class="c">/g, '<div style="background:#fff;padding:6px">')}</body></html>`);
console.log(`${cards.length} figures → ${out}`);
