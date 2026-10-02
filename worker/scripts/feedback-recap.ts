/**
 * Recap of the mistake reports ("Báo lỗi") collected in the app — what the solver got wrong, grouped by kind.
 *
 *   npx tsx scripts/feedback-recap.ts [--since 2026-10-01] [--out ../tools/feedback/recap.md]
 *
 * Reads the local D1 database (the one `wrangler dev --persist-to .wrangler/state` uses). Prints a summary and
 * writes a Markdown report with every report's problem, the reported content (snapshot), the note, the model
 * and the prompt version.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const dbDir = new URL("../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/", import.meta.url).pathname;
const db = flag("db") ?? `${dbDir}${readdirSync(dbDir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite")}`;
const since = flag("since") ?? "1970-01-01";
const out = flag("out") ?? new URL("../../tools/feedback/recap.md", import.meta.url).pathname;

interface Row {
  id: string;
  scan_id: string;
  question_id: string;
  target_kind: string;
  target_id: string | null;
  target_text: string | null;
  category: string;
  note: string | null;
  problem_text: string | null;
  model: string | null;
  prompt_version: string | null;
  verification_status: string | null;
  created_at: string;
}

const CATEGORY: Record<string, string> = {
  wrong_math: "Sai toán (kết quả hoặc tính toán)",
  skipped_step: "Bỏ bước / lập luận chưa chặt",
  not_grade9: "Phương pháp không phù hợp lớp 9",
  figure: "Hình vẽ sai hoặc thiếu",
  unclear: "Giải thích khó hiểu",
  language: "Lỗi ngôn ngữ / ký hiệu",
  other: "Khác",
};
const TARGET: Record<string, string> = { lesson: "cả bài", step: "bước", hint: "gợi ý", answer: "đáp số", figure: "hình vẽ" };

const json = execFileSync("sqlite3", ["-json", db, `SELECT * FROM lesson_feedback WHERE created_at >= '${since.replace(/'/g, "")}' ORDER BY category, created_at`], { encoding: "utf8" });
const rows: Row[] = json.trim() ? JSON.parse(json) : [];
const count = (key: (r: Row) => string) => rows.reduce<Record<string, number>>((acc, r) => ((acc[key(r)] = (acc[key(r)] ?? 0) + 1), acc), {});

const byCategory = count((r) => r.category);
const byModel = count((r) => `${r.model ?? "?"} · ${r.prompt_version ?? "?"}`);
const lines: string[] = [
  `# Báo lỗi — recap (${new Date().toISOString().slice(0, 10)})`,
  "",
  `${rows.length} report(s)${since !== "1970-01-01" ? ` since ${since}` : ""}.`,
  "",
  "| Loại lỗi | Số lượng |",
  "|---|---:|",
  ...Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([c, n]) => `| ${CATEGORY[c] ?? c} | ${n} |`),
  "",
  "| Model · prompt | Số lượng |",
  "|---|---:|",
  ...Object.entries(byModel).sort((a, b) => b[1] - a[1]).map(([m, n]) => `| ${m} | ${n} |`),
];
for (const [category, label] of Object.entries(CATEGORY)) {
  const group = rows.filter((r) => r.category === category);
  if (group.length === 0) continue;
  lines.push("", `## ${label} (${group.length})`);
  for (const r of group) {
    lines.push(
      "",
      `### ${r.created_at.slice(0, 16).replace("T", " ")} — ${TARGET[r.target_kind] ?? r.target_kind}${r.target_id ? ` ${r.target_id}` : ""} · ${r.model ?? "?"} (${r.prompt_version ?? "?"}, ${r.verification_status ?? "?"})`,
      "",
      `**Đề:** ${(r.problem_text ?? "").replace(/\n/g, " ").slice(0, 600)}`,
      "",
      r.target_text ? `**Nội dung bị báo lỗi:**\n\n> ${r.target_text.replace(/\n/g, "\n> ")}` : "",
      "",
      `**Ghi chú:** ${r.note ?? "—"}`,
      "",
      `<sub>scan ${r.scan_id} · ${r.question_id} · report ${r.id}</sub>`,
    );
  }
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n") + "\n");
console.log(`${rows.length} report(s): ${Object.entries(byCategory).map(([c, n]) => `${c} ${n}`).join(", ") || "none"} → ${out}`);
