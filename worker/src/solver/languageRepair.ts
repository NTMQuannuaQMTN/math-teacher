import { z } from "zod";
import { hasForeignDisplayText, isStrippedVietnamese } from "../../../shared/src/language";
import type { ModelLesson } from "../../../shared/src/solution";
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
const RepairSchema = z.strictObject({ items: z.array(z.strictObject({ id: z.string().max(20), text: z.string().max(3000) })).max(40) });
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
  });
  return out;
}

const formulas = (t: string) => t.match(/\$\$?[^$]*\$\$?/g) ?? [];
const proseNumbers = (t: string) => (t.replace(/\$\$?[^$]*\$\$?/g, " ").match(/\d+(?:[.,]\d+)?/g) ?? []).join("|");
const needsRepair = (t: string) => hasForeignDisplayText(t) || isStrippedVietnamese(t);

/** True when the only language problems are in prose fields (formulas never need a language rewrite). */
export function repairableLanguage(lesson: ModelLesson): boolean {
  const bad = fieldsOf(structuredClone(lesson)).filter((f) => needsRepair(f.get()));
  return bad.length > 0 && bad.length <= 30 && bad.reduce((n, f) => n + f.get().length, 0) <= 8000;
}

export async function repairLanguage(
  lesson: ModelLesson,
  model: JsonModel,
  signal: AbortSignal,
  onUsage?: (u: Usage) => void,
  log: (m: string) => void = () => undefined,
): Promise<ModelLesson | null> {
  const copy = structuredClone(lesson);
  const bad = fieldsOf(copy).filter((f) => needsRepair(f.get()));
  if (!bad.length || bad.length > 30) return null;
  const started = Date.now();
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
    return null;
  }
  const parsed = RepairSchema.safeParse((() => { try { return JSON.parse(text); } catch { return null; } })());
  if (!parsed.success) return null;
  const byId = new Map(parsed.data.items.map((i) => [i.id, i.text.normalize("NFC").trim()]));
  let fixed = 0;
  for (const f of bad) {
    const next = byId.get(f.id);
    const before = f.get();
    // Mathematics unchanged, numbers unchanged, and the language problem actually gone.
    if (!next || JSON.stringify(formulas(next)) !== JSON.stringify(formulas(before)) || proseNumbers(next) !== proseNumbers(before) || needsRepair(next)) continue;
    f.set(next);
    fixed++;
  }
  log(`language repair: ${fixed}/${bad.length} field(s) rewritten in ${Math.round((Date.now() - started) / 1000)} s`);
  return fixed === bad.length ? copy : null;
}
