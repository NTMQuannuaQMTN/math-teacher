/**
 * 4-hour session benchmark runner (data/benchmark-4h). Runs the production solver entry point (solveProblem) on each
 * problem's `input` only — reference answers are read afterwards, for grading — and writes per-problem results.
 *
 *   [ROUTINE=off] npx tsx scripts/eval-4h.ts <dev|heldout|exams-external> <none|free> <label> [id,id,…]
 *
 * Modes
 *   none  the model is unavailable (every call fails at once): measures what the deterministic layers deliver alone.
 *         This is also what a student gets whenever the free model times out or its quota is exhausted.
 *   free  OpenRouter nvidia/nemotron-3-super-120b-a12b:free (no charge) with the production options for a free hosted
 *         model and the production 26 s generation deadline; responses cached (tools/benchmark/cache), never a paid
 *         provider. Each cache miss uses one of the account's 50 free requests per day.
 * Output: tools/eval-4h/results/<label>-<split>.json (+ lessons/ for manual review).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import type { JsonModel } from "../src/solver/llm";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
import { hostedModelOptions } from "../src/solver/routing";
import { OcrFailure } from "../src/ocr/provider";
import { CachedModel } from "./lib/modelCache";

const [split = "dev", mode = "none", label = "run", only] = process.argv.slice(2);
const root = new URL("../../", import.meta.url).pathname;
const rows = readFileSync(`${root}data/benchmark-4h/${split}.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l))
  .filter((r) => !only || only.split(",").includes(r.id));
const vars = Object.fromEntries(
  readFileSync(`${root}worker/.dev.vars`, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

class Unavailable implements JsonModel {
  readonly name = "none";
  readonly model = "unavailable";
  calls = 0;
  async complete(): Promise<string> {
    this.calls++;
    throw new OcrFailure("provider_error", "model unavailable (offline evaluation)", true);
  }
}

function modelFor(text: string): JsonModel {
  if (mode === "none") return new Unavailable();
  const id = "nvidia/nemotron-3-super-120b-a12b:free";
  if (!vars.LOCAL_LLM_API_KEY) throw new Error("no LOCAL_LLM_API_KEY");
  const options = hostedModelOptions(text, { simpleEffort: "minimal", effort: "minimal", complexMaxTokens: 6_000, complexRequestTimeoutMs: 240_000 });
  const inner = new LocalJsonModel("https://openrouter.ai/api", id, { apiKey: vars.LOCAL_LLM_API_KEY, thinking: false, ...options });
  return new CachedModel(inner, JSON.stringify(options), process.env.OFFLINE === "1");
}

// ---------------------------------------------------------------------------------------------------------- grading
/** Plain comparable text: LaTeX fractions/roots → a/b, sqrt(n); unicode minus; no spaces or $. */
export function plain(s: string): string {
  let t = s.normalize("NFC").replace(/[−–]/g, "-").replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\\quad|\$/g, "");
  for (let i = 0; i < 3; i++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)").replace(/√\(?(\d+)\)?/g, "sqrt($1)").replace(/\\cdot|·/g, "*");
  // List separators ("; " and ", ") become "|"; a comma between two digits stays a decimal comma (2,5).
  t = t.replace(/;|,(?=\s)|,(?=\D)|(?<=\D),/g, "|").replace(/\s+/g, "");
  // (24)/(5) → 24/5 when the parts are plain numbers
  t = t.replace(/\((-?\d+)\)\/\((\d+)\)/g, "$1/$2").replace(/\(sqrt\((\d+)\)\)/g, "sqrt($1)");
  return t;
}

function tokenVariants(ref: string): string[] {
  const r = plain(ref.replace(/\\sqrt\{(\d+)\}/g, "\\sqrt{$1}"));
  const out = new Set([r]);
  const coefRoot = /^(\d+)sqrt\((\d+)\)$/.exec(r);
  if (coefRoot) out.add(`${coefRoot[1]}*sqrt(${coefRoot[2]})`);
  const over = /^(\d+)sqrt\((\d+)\)\/(\d+)$/.exec(r);
  if (over) { out.add(`(${over[1]}sqrt(${over[2]}))/${over[3]}`); out.add(`${over[1]}sqrt(${over[2]})/${over[3]}`); }
  const frac = /^(-?)(\d+)\/(\d+)$/.exec(r);
  if (frac) out.add(`${frac[1]}${(Number(frac[2]) / Number(frac[3])).toString().replace(/\.?0+$/, "")}`.replace(".", ","));
  if (frac) out.add(`${frac[1]}${Number(frac[2]) / Number(frac[3])}`);
  return [...out];
}

function containsToken(hay: string, token: string): boolean {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A number must not be part of a longer number (2 inside 24) nor carry a sign it doesn't have.
  // Not preceded by a digit, a decimal point/comma after a digit (2,5), a slash (1/2) or, for a positive token, a minus.
  const before = /^\d/.test(token) ? "(?<![\\d/])(?<!\\d[.,])(?<!-)" : "(?<![\\d/])(?<!\\d[.,])";
  return new RegExp(`${before}${esc}(?![\\d]|[.,]\\d|sqrt)`).test(hay);
}

/** Pairs: "(2,3)" in any of (x;y) / (x, y) spellings. */
function hasPair(hay: string, [a, b]: [number, number]): boolean {
  return hay.includes(`(${a}|${b})`) || hay.includes(`(${a},${b})`);
}

const TEXT_ACCEPT: Record<string, RegExp[]> = {
  "held3-quartic-factor": [/x\^2\+2xy\+2y\^2|x\^2\+2y\^2\+2xy|2y\^2\+2xy\+x\^2/, /x\^2-2xy\+2y\^2|x\^2\+2y\^2-2xy|2y\^2-2xy\+x\^2/],
  "held3-telescoping": [/n\/\(?n\+1\)?|\(n\)\/\(n\+1\)|1-1\/\(?n\+1\)?|1-\(1\)\/\(n\+1\)/],
  "alg-d4": [/m>1/],
  "held3-coin-invariant": [/không/i],
  "held3-domino-game": [/Bình/],
};

function expandPm(t: string): string {
  // x=\pm2 → also lists 2 and -2
  return t.replace(/\\pm(\d+)/g, (_, d) => `${d},-${d}`).replace(/±(\d+)/g, (_, d) => `${d},-${d}`);
}

interface Row { id: string; topic: string; answer_kind: string; reference: unknown; input: string; difficulty: string; input_mode: string }

function grade(r: Row, answerText: string): { answer: "correct" | "wrong" | "n/a" | "review"; missing: string[] } {
  const hay = expandPm(plain(answerText));
  if (r.answer_kind === "values") {
    const missing = (r.reference as string[]).filter((v) => !tokenVariants(v).some((t) => containsToken(hay, t)));
    return { answer: missing.length ? "wrong" : "correct", missing };
  }
  if (r.answer_kind === "pairs") {
    const missing = (r.reference as [number, number][]).filter((p) => !hasPair(hay, p)).map((p) => `(${p})`);
    return { answer: missing.length ? "wrong" : "correct", missing };
  }
  const accept = TEXT_ACCEPT[r.id];
  if (accept) {
    const ok = accept.every((re) => re.test(hay) || re.test(answerText));
    return { answer: ok ? "correct" : "wrong", missing: ok ? [] : ["text"] };
  }
  return { answer: r.answer_kind === "proof" ? "review" : "n/a", missing: [] };
}

// ------------------------------------------------------------------------------------------------------------- run
const outDir = `${root}tools/eval-4h/results`;
mkdirSync(`${outDir}/lessons/${label}-${split}`, { recursive: true });
const results = [];
for (const r of rows as Row[]) {
  const model = modelFor(r.input);
  const logs: string[] = [];
  const started = Date.now();
  let entry: Record<string, unknown>;
  try {
    const res = await solveProblem(model, VN_GRADE_9, r.input, { signal: AbortSignal.timeout(Number(process.env.DEADLINE_MS ?? 26_000)), log: (m) => logs.push(m), routine: process.env.ROUTINE !== "off" });
    const l = res.lesson;
    const answerText = [l.finalAnswer.text, l.finalAnswer.math ?? ""].join(" \n ");
    const g = grade(r, answerText);
    entry = {
      id: r.id, topic: r.topic, kind: r.answer_kind, ok: true, producedBy: res.model, status: res.verification.status,
      attempts: res.attempts, ms: Date.now() - started, answer: g.answer, missing: g.missing, finalAnswer: l.finalAnswer.text.slice(0, 400),
      steps: l.steps.length, hints: l.hints.length,
    };
    writeFileSync(`${outDir}/lessons/${label}-${split}/${r.id.replace(/[^A-Za-z0-9._-]/g, "_")}.json`, JSON.stringify({ input: r.input, ...res, logs }, null, 2));
  } catch (err) {
    entry = {
      id: r.id, topic: r.topic, kind: r.answer_kind, ok: false, error: err instanceof OcrFailure ? err.kind : (err as Error).name,
      message: (err as Error).message.slice(0, 200), ms: Date.now() - started, answer: "failed", missing: [],
    };
  }
  entry.modelCalls = model instanceof Unavailable ? model.calls : model instanceof CachedModel ? model.stats.misses + model.stats.hits : 0;
  entry.cacheMisses = model instanceof CachedModel ? model.stats.misses : 0;
  results.push(entry);
  console.log(`${String(entry.id).padEnd(22)} ${String(entry.topic).padEnd(14)} ${entry.ok ? `${entry.producedBy} ${entry.status}` : `FAILED ${entry.error}`}  answer=${entry.answer}${(entry.missing as string[]).length ? ` missing=${(entry.missing as string[]).join("|")}` : ""}  ${entry.ms}ms`);
}

const topics = ["algebra", "geometry", "number_theory", "combinatorics"];
const summary: Record<string, unknown> = {};
for (const t of [...topics, "all"]) {
  const s = results.filter((e) => t === "all" || e.topic === t);
  const gradable = s.filter((e) => e.kind !== "proof" || TEXT_ACCEPT[String(e.id)]);
  summary[t] = {
    n: s.length,
    lesson: s.filter((e) => e.ok).length,
    verified: s.filter((e) => e.ok && e.status === "verified").length,
    answerGradable: gradable.length,
    answerCorrect: gradable.filter((e) => e.answer === "correct").length,
    lessonWrongAnswer: gradable.filter((e) => e.ok && e.answer === "wrong").length,
    proofsDelivered: s.filter((e) => e.kind === "proof" && e.ok).length,
    proofs: s.filter((e) => e.kind === "proof").length,
  };
}
const file = `${outDir}/${label}-${split}.json`;
writeFileSync(file, JSON.stringify({ label, split, mode, createdAt: new Date().toISOString(), summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 1));
console.log(`wrote ${file}`);
