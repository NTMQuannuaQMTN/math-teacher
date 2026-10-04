/**
 * Human-review dump of a benchmark result file: for each item, the lesson as a student would read it plus the
 * machine signals a reviewer needs (declared techniques, curriculum scan, per-step verification, figure coverage).
 *
 *   npx tsx scripts/review-dump.ts ../tools/benchmark/results/<file>.json > review.md
 */
import { readFileSync } from "node:fs";
import { figureCoverage } from "../../shared/src/figureComplete";
import { resolveFigure } from "../../shared/src/geometry";
import { gradeLevelReport } from "../../shared/src/gradeLevel";
import { isKnownTechnique, KB_TECHNIQUES, techniqueName } from "../../shared/src/knowledgeBase";
import type { ModelLesson } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";

const file = process.argv[2];
if (!file) throw new Error("usage: review-dump.ts <result.json>");
const run = JSON.parse(readFileSync(file, "utf8")) as {
  summary: Record<string, unknown>;
  rows: { id: string; grade: string; status: string | null; attempts: number; modelSeconds: number; error?: string; log?: string[]; lesson: ModelLesson | null }[];
};

const out: string[] = [`# Review: ${run.summary.exp} (${run.summary.system}, ${run.summary.promptVersion})`];
for (const r of run.rows) {
  out.push("", `## ${r.id} — ${r.grade}, ${r.status ?? "no lesson"}, ${r.attempts} attempt(s), ${r.modelSeconds} s${r.error ? ` — ERROR ${r.error}` : ""}`);
  for (const l of r.log ?? []) out.push(`> ${l.slice(0, 300)}`);
  const l = r.lesson;
  if (!l) continue;
  const v = verifyLesson(l);
  const gl = gradeLevelReport(v.lesson);
  const advanced = l.analysis.techniques.filter((t) => KB_TECHNIQUES.find((k) => k.id === t)?.advanced);
  out.push(
    "",
    `- status: ${l.analysis.status}${l.analysis.statusReason ? ` (${l.analysis.statusReason})` : ""}; verification ${v.verification.status}`,
    `- techniques: ${l.analysis.techniques.map((t) => `${t}${isKnownTechnique(t) ? "" : " (UNKNOWN)"} = ${techniqueName(t) ?? "?"}`).join("; ") || "—"}${advanced.length ? ` — advanced: ${advanced.join(", ")}` : ""}`,
    `- concepts: ${l.analysis.concepts.join("; ")}`,
    `- curriculum scan: forbidden [${gl.forbidden.join("; ")}], advisory [${gl.advisory.join("; ")}]`,
    `- per-step: ${(v.verification.steps ?? []).map((s) => `${s.stepId}:${s.status}`).join(" ")}`,
    `- checks: ${v.verification.checks.map((c) => `${c.passed ? "✓" : "✗"} ${c.label}`).join(" | ").slice(0, 600)}`,
  );
  if (v.lesson.figure && v.resolvedFigure) {
    const c = figureCoverage(v.lesson, v.resolvedFigure)!;
    const f = v.lesson.figure;
    out.push(
      `- figure: ${f.points.length} points (${f.points.map((p) => `${p.id}=${p.kind}(${p.refs.join(",")})`).join(" ")}), ${f.lines.length} lines, ${f.circles.length} circles, ${f.angles.length} angles; ` +
        `segments ${c.segments.drawn}/${c.segments.mentioned}, angles ${c.angles.drawn}/${c.angles.mentioned}, missing [${c.missing.join(", ")}], steps synced ${c.steps.synced}/${c.steps.mentioning}`,
      `- figure checks: ${f.checks.map((x) => `${x.role}:${x.kind}(${x.refs.join(",")})`).join(" ")}`,
    );
    const resolved = resolveFigure(f);
    if (resolved.errors.length) out.push(`- figure errors: ${resolved.errors.join("; ")}`);
  } else if (l.figure || /tam giác|đường tròn/.test(l.analysis.statement)) {
    out.push(`- figure: ${l.figure ? "dropped by the verifier" : "none"} (${v.verification.figureIssue ?? "—"})`);
  }
  out.push("", `**Chiến lược:** ${l.strategy}`, "");
  v.lesson.hints.forEach((h, i) => out.push(`- Gợi ý ${i + 1} (→${h.stepId}): ${h.question} → ${h.explanation}${h.math ? ` [${h.math}]` : ""}${h.focus.length ? ` {${h.focus.join(",")}}` : ""}`));
  out.push("");
  v.lesson.steps.forEach((s, i) =>
    out.push(
      `${i + 1}. **${s.title}**${s.uses.length ? ` (dựa vào ${s.uses.join(", ")})` : ""}: ${s.explanation}${s.math ? `\n   $$${s.math}$$` : ""}${s.reason ? `\n   _(${s.reason})_` : ""}${s.geometryActions.length ? `\n   {${s.geometryActions.map((a) => `${a.action}:${a.targets.join(",")}`).join(" ")}}` : ""}`,
    ),
  );
  out.push("", `**Đáp số:** ${l.finalAnswer.text}${l.finalAnswer.math ? ` [${l.finalAnswer.math}]` : ""}`);
  out.push(`**Answer checks:** ${l.answerChecks.map((c) => `${c.kind}: ${c.statements.join("; ")}${c.expected ? ` ⇒ ${c.expected}` : ""}`).join(" | ") || "—"}`);
}
console.log(out.join("\n"));
