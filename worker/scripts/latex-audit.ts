/**
 * Renders every formula of every stored lesson with KaTeX (as the app does) and lists the ones that fail.
 *
 *   npx tsx scripts/latex-audit.ts [--fixed | --app]
 *     --fixed  after the server's tidy (what a new lesson stores)
 *     --app    as the app renders a stored lesson (repairLatex on text, displayFormula on maths fields)
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { displayFormula, parseMathText, repairLatex, wrapBareLatex } from "../../shared/src/mathText";
import type { ModelLesson } from "../../shared/src/solution";
import { tidy } from "../src/solver/pipeline";

const katex = createRequire(import.meta.url)("../../mobile/node_modules/katex") as { renderToString(tex: string, o: object): string };
const fixed = process.argv.includes("--fixed");
const app = process.argv.includes("--app");
const dir = new URL("../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/", import.meta.url).pathname;
const db = dir + readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
const rows: { id: string; lesson_json: string }[] = JSON.parse(
  execFileSync("sqlite3", ["-json", db, "SELECT scan_id || '/' || question_id AS id, lesson_json FROM solutions WHERE lesson_json IS NOT NULL"], { encoding: "utf8", maxBuffer: 1 << 26 }),
);

let formulas = 0;
const failures: string[] = [];
const tryRender = (where: string, tex: string, display: boolean) => {
  formulas++;
  try {
    katex.renderToString(tex, { throwOnError: true, strict: "ignore", trust: false, displayMode: display });
  } catch (err) {
    failures.push(`${where}: ${(err as Error).message.split("\n")[0]!.slice(0, 90)} :: ${tex.replace(/\n/g, "⏎").slice(0, 140)}`);
  }
};
for (const r of rows) {
  let l = JSON.parse(r.lesson_json) as ModelLesson;
  if (fixed) l = tidy(l);
  const texts: [string, string | null][] = [
    ["statement", l.analysis.statement],
    ["strategy", l.strategy],
    ["answer", l.finalAnswer.text],
    ...l.steps.flatMap((s): [string, string | null][] => [[`${s.id}.title`, s.title], [`${s.id}.explanation`, s.explanation], [`${s.id}.reason`, s.reason]]),
    ...l.hints.flatMap((h): [string, string | null][] => [[`${h.id}.question`, h.question], [`${h.id}.explanation`, h.explanation]]),
  ];
  for (const [where, t] of texts) for (const seg of t ? parseMathText(app ? wrapBareLatex(repairLatex(t)) : t) : []) if (seg.kind === "math") tryRender(`${r.id} ${where}`, seg.value, seg.display);
  const maths: [string, string | null][] = [["answer.math", l.finalAnswer.math], ...l.steps.map((s): [string, string | null] => [`${s.id}.math`, s.math]), ...l.hints.map((h): [string, string | null] => [`${h.id}.math`, h.math])];
  for (const [where, m] of maths) {
    if (!m) continue;
    if (!app) tryRender(`${r.id} ${where}`, m, true);
    else for (const seg of parseMathText(wrapBareLatex(repairLatex(displayFormula(m))))) if (seg.kind === "math") tryRender(`${r.id} ${where}`, seg.value, seg.display);
  }
}
console.log(`${rows.length} lessons, ${formulas} formulas, ${failures.length} fail to render${fixed ? " (after tidy)" : app ? " (as the app renders stored lessons)" : " (as stored)"}`);
for (const f of failures) console.log("  " + f);
