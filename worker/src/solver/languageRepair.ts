import { z } from "zod";
import { hasForeignDisplayText, isStrippedVietnamese } from "../../../shared/src/language";
import type { ModelLesson } from "../../../shared/src/solution";
import { fixJsonLatexEscapes } from "./jsonLatex";
import { toStrictJsonSchema } from "./jsonSchema";
import type { JsonModel } from "./llm";
import type { Usage } from "./pricing";

/**
 * A model lesson that is mathematically usable but leaves a few words in English or another script ("condition",
 * "the", a Chinese phrase in one hint) used to be thrown away and regenerated in full — minutes on a free model, often
 * with the same slip. Instead, only the offending prose fields are sent back for a Vietnamese rewrite, and a rewrite is
 * accepted only when it cannot have changed the mathematics: every $…$ formula identical and in the same order, every
 * number outside the formulas identical, and the new text passing the same language checks. Anything else: no repair.
 */
const RepairSchema = z.strictObject({ items: z.array(z.strictObject({ id: z.string().max(20), text: z.string().max(3000) })).max(60) });
const REPAIR_JSON_SCHEMA = toStrictJsonSchema(RepairSchema);

const SYSTEM = `Bạn là giáo viên Toán THCS. Mỗi mục dưới đây là một đoạn trong bài giảng cho học sinh lớp 9 nhưng còn lẫn từ tiếng Anh hoặc chữ nước ngoài.
Viết lại TỪNG đoạn bằng tiếng Việt tự nhiên, có dấu đầy đủ, dùng thuật ngữ học sinh lớp 9 quen thuộc.
Quy tắc bắt buộc: chép y nguyên mọi công thức nằm giữa hai dấu $ (không sửa một kí tự nào, giữ đúng thứ tự); giữ nguyên mọi con số; không thêm hay bớt ý; không giải lại bài.
Trả về JSON {"items":[{"id":"...","text":"..."}]} với đúng các id đã cho.`;

type Field = { id: string; get: () => string; set: (t: string) => void };

function fieldsOf(lesson: ModelLesson): Field[] {
  const out: Field[] = [];
  const add = (id: string, get: () => string | null, set: (t: string) => void) => {
    const v = get();
    if (v) out.push({ id, get: () => get() ?? "", set });
  };
  const a = lesson.analysis;
  add("subtopic", () => a.subtopic, (t) => (a.subtopic = t));
  // Moved into a displayed note when the status is reconciled (verify.ts reconcileStatus): repair it here too.
  add("statusReason", () => a.statusReason, (t) => (a.statusReason = t));
  a.concepts.forEach((_, i) => add(`concept${i}`, () => a.concepts[i]!, (t) => (a.concepts[i] = t)));
  a.givens.forEach((_, i) => add(`given${i}`, () => a.givens[i]!, (t) => (a.givens[i] = t)));
  a.unknowns.forEach((_, i) => add(`unknown${i}`, () => a.unknowns[i]!, (t) => (a.unknowns[i] = t)));
  a.constraints.forEach((_, i) => add(`constraint${i}`, () => a.constraints[i]!, (t) => (a.constraints[i] = t)));
  a.interpretationNotes.forEach((_, i) => add(`note${i}`, () => a.interpretationNotes[i]!, (t) => (a.interpretationNotes[i] = t)));
  add("strategy", () => lesson.strategy, (t) => (lesson.strategy = t));
  add("final", () => lesson.finalAnswer.text, (t) => (lesson.finalAnswer.text = t));
  lesson.hints.forEach((h, i) => {
    add(`h${i}q`, () => h.question, (t) => (h.question = t));
    add(`h${i}c`, () => h.cue, (t) => (h.cue = t));
    add(`h${i}e`, () => h.explanation, (t) => (h.explanation = t));
  });
  lesson.steps.forEach((s, i) => {
    add(`s${i}t`, () => s.title, (t) => (s.title = t));
    add(`s${i}e`, () => s.explanation, (t) => (s.explanation = t));
    add(`s${i}r`, () => s.reason, (t) => (s.reason = t));
    // Step audit fields are checked for language too.
    add(`s${i}o`, () => s.operation ?? null, (t) => (s.operation = t));
    (s.factsUsed ?? []).forEach((_, j) => add(`s${i}f${j}`, () => s.factsUsed![j]!, (t) => (s.factsUsed![j] = t)));
    if (s.verification) {
      const v = s.verification;
      add(`s${i}vm`, () => v.method, (t) => (v.method = t));
      add(`s${i}vr`, () => v.reason ?? null, (t) => (v.reason = t));
    }
  });
  return out;
}

const formulas = (t: string) => t.match(/\$\$?[^$]*\$\$?/g) ?? [];
const proseNumbers = (t: string) => (t.replace(/\$\$?[^$]*\$\$?/g, " ").match(/\d+(?:[.,]\d+)?/g) ?? []).join("|");
const needsRepair = (t: string) => hasForeignDisplayText(t) || isStrippedVietnamese(t);

/** True when the only language problems are in prose fields (formulas never need a language rewrite). */
export function repairableLanguage(lesson: ModelLesson): boolean {
  const bad = fieldsOf(structuredClone(lesson)).filter((f) => needsRepair(f.get()));
  // A lesson written mostly in English (training run: 23+ fields) is worth one larger rewrite: formulas and numbers are
  // still guaranteed unchanged.
  return bad.length > 0 && bad.length <= 60 && bad.reduce((n, f) => n + f.get().length, 0) <= 16000;
}

export async function repairLanguage(
  lesson: ModelLesson,
  model: JsonModel,
  signal: AbortSignal,
  onUsage?: (u: Usage) => void,
  log: (m: string) => void = () => undefined,
): Promise<ModelLesson | null> {
  const copy = structuredClone(lesson);
  const started = Date.now();
  let fixed = 0, total = 0;
  // Two rounds: a long lesson's first rewrite can miss a few fields (or change a number); only those go back once more.
  for (let round = 0; round < 2 && !signal.aborted; round++) {
    const bad = fieldsOf(copy).filter((f) => needsRepair(f.get()));
    if (!bad.length || bad.length > 60) break;
    if (round === 0) total = bad.length;
    let text: string;
    try {
      text = await model.complete({
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ items: bad.map((f) => ({ id: f.id, text: f.get() })) }) },
        ],
        schema: REPAIR_JSON_SCHEMA,
        schemaName: "language_repair",
        signal,
        onUsage,
      });
    } catch (err) {
      log(`language repair request failed (${(err as Error).message.slice(0, 80)})`);
      break;
    }
    const parsed = RepairSchema.safeParse((() => { try { return JSON.parse(fixJsonLatexEscapes(text)); } catch { return null; } })());
    if (!parsed.success) {
      log(`language repair: unreadable response (${text.length} chars)`);
      break;
    }
    const byId = new Map(parsed.data.items.map((i) => [i.id, i.text.normalize("NFC").trim()]));
    const rejected: string[] = [];
    for (const f of bad) {
      const next = byId.get(f.id);
      const before = f.get();
      // Mathematics unchanged, numbers unchanged, and the language problem actually gone.
      const why = !next ? "missing" : JSON.stringify(formulas(next)) !== JSON.stringify(formulas(before)) ? "formulas changed" : proseNumbers(next) !== proseNumbers(before) ? "numbers changed" : needsRepair(next) ? "still foreign" : null;
      if (why) { rejected.push(`${f.id}: ${why}`); continue; }
      f.set(next!);
      fixed++;
    }
    if (rejected.length) log(`language repair round ${round + 1}: not accepted ${rejected.slice(0, 6).join(", ")}`);
    if (!rejected.length) break;
  }
  log(`language repair: ${fixed}/${total} field(s) rewritten in ${Math.round((Date.now() - started) / 1000)} s`);
  // Every accepted rewrite is kept; what is still foreign is handled by dropForeignMetadata or rejected by the caller.
  return fixed > 0 ? copy : null;
}

/**
 * Optional metadata that is still not Vietnamese after the repair (a concept label, an interpretation note, a step's
 * operation / verification text / facts, the status reason) is removed rather than shown — or used to discard a lesson
 * whose mathematics is fine. The restated givens / unknowns / constraints go too (training 2026-10-15: a correct game
 * lesson was discarded over "Players: An and Bình"): the problem statement itself is shown verbatim. The solution text
 * (steps, hints, final answer) is never removed: if it stays foreign the lesson is still rejected.
 */
export function dropForeignMetadata(lesson: ModelLesson): { lesson: ModelLesson; dropped: number } {
  const copy = structuredClone(lesson);
  let dropped = 0;
  const keep = (t: string) => { const ok = !needsRepair(t); if (!ok) dropped++; return ok; };
  const a = copy.analysis;
  // The "Dạng bài" label: if still foreign, the specialty's Vietnamese name rather than a discarded lesson.
  if (a.subtopic && !keep(a.subtopic)) a.subtopic = ({ algebra: "Đại số", geometry: "Hình học", number_theory: "Số học", combinatorics: "Tổ hợp" } as Record<string, string>)[a.topic] ?? "Toán";
  a.concepts = a.concepts.filter(keep);
  a.givens = a.givens.filter(keep);
  a.unknowns = a.unknowns.filter(keep);
  a.constraints = a.constraints.filter(keep);
  a.interpretationNotes = a.interpretationNotes.filter(keep);
  if (a.statusReason && !keep(a.statusReason)) a.statusReason = null;
  for (const s of copy.steps) {
    if (s.operation && !keep(s.operation)) s.operation = null;
    if (s.factsUsed) s.factsUsed = s.factsUsed.filter(keep);
    if (s.verification) {
      if (s.verification.method && !keep(s.verification.method)) s.verification.method = null;
      if (s.verification.reason && !keep(s.verification.reason)) s.verification.reason = null;
    }
  }
  return { lesson: copy, dropped };
}
