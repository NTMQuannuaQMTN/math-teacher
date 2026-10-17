import { evalExpression } from "./expr";
import { expressionMod } from "./integerTargets";
import type { ModelLesson } from "./solution";

/**
 * The reviewer (2026-10-15): "Phải đảm bảo đúng từ đầu đến cuối chứ không phải sai lúc đầu xong sửa lại khúc cuối";
 * "11 chia 5 dư 6 là sao?". A lesson can reach the right final answer through wrong steps. Every remainder claim whose
 * terms are closed numbers (powers included) is checked exactly:
 *   - congruence chains  "2^{2026} \equiv 2^2 \equiv 6 \pmod{10}"  — all members must agree modulo m;
 *   - prose              "11 chia 5 dư 6", "$7^{100}$ chia cho $5$ dư $1$" — the remainder must be < m and correct.
 * And the solver's own working must not leak into the lesson ("Chờ đã…", "kết quả từ máy").
 */

const clean = (s: string) => s.replace(/\\left|\\right|\\,|\\;|\\!|\\quad|\\qquad|\{,\}/g, " ").replace(/[−–]/g, "-");

function congruenceClaims(math: string): string[] {
  const out: string[] = [];
  const clauses = clean(math).split(/\\\\|\\Rightarrow|\\Leftrightarrow|\\implies|\\iff|⇒|⇔|;|\\text\{[^}]*\}|,(?![^{]*\})/);
  for (const clause of clauses) {
    const mod = /\\pmod\s*\{?\s*(\d+)\s*\}?|\(\s*mod\s*(\d+)\s*\)|\\bmod\s*\{?(\d+)\}?/.exec(clause);
    if (!mod || !/\\equiv|≡/.test(clause)) continue;
    const m = BigInt(mod[1] ?? mod[2] ?? mod[3]!);
    if (m < 2n) continue;
    const body = clause.slice(0, mod.index);
    const members = body.split(/\\equiv|≡/).map((p) => p.trim()).filter(Boolean);
    const values = members.map((p) => ({ p, v: expressionMod(p.replace(/^[^\d(-]*/, ""), m) }));
    const known = values.filter((x) => x.v !== null && /^[\d\s+\-*^(){}\\cdota-z]*$/i.test(x.p) && !/[a-z]/i.test(x.p.replace(/\\cdot|\\times/g, "")));
    for (let i = 1; i < known.length; i++)
      if (known[i]!.v !== known[0]!.v) out.push(`"${known[0]!.p} ≡ ${known[i]!.p} (mod ${m})" is false: ${known[0]!.p} ≡ ${known[0]!.v}, ${known[i]!.p} ≡ ${known[i]!.v} (mod ${m})`);
  }
  return out;
}

function proseRemainderClaims(text: string): string[] {
  const out: string[] = [];
  const t = clean(text).replace(/\$/g, " ");
  for (const m of t.matchAll(/(?<![\w^.])(\d+(?:\s*\^\s*\{?\s*\d+\s*\}?)?(?:\s*[+\-*]\s*\d+(?:\s*\^\s*\{?\s*\d+\s*\}?)?)*)\s+chia\s+(?:cho\s+)?(\d+)\s+(?:thì\s+)?(?:có\s+)?(?:số\s+)?dư\s+(?:là\s+)?(\d+)(?![\d^])/giu)) {
    const [, expr, mStr, rStr] = m;
    const mod = BigInt(mStr!), r = BigInt(rStr!);
    if (mod < 2n) continue;
    const v = expressionMod(expr!, mod);
    if (v === null) continue;
    if (r >= mod) out.push(`"${expr!.trim()} chia ${mod} dư ${r}" is wrong: a remainder is less than the divisor (${expr!.trim()} chia ${mod} dư ${v})`);
    else if (v !== r) out.push(`"${expr!.trim()} chia ${mod} dư ${r}" is wrong: the remainder is ${v}`);
  }
  return out;
}

/**
 * Plain arithmetic written as fact: "C = 180^\circ - 80^\circ = 110^\circ" (geo8-h4, served with the two angles swapped).
 * In every "=" chain, the members made only of numbers (units, degrees and \text{…} removed) must have equal values.
 * Members with letters, factorials, huge powers or "≈" are skipped; rounding within 0.6 % is accepted.
 */
function arithmeticClaims(math: string): string[] {
  const out: string[] = [];
  // A member carrying words ("36 \text{ phút}", "506 \text{ dư } 2") is marked: units make it a different quantity.
  const t = clean(math).replace(/\^\s*\{?\s*\\circ\s*\}?|\^\s*\\text\{o\}|°/g, " ").replace(/\\(?:text|mathrm|operatorname)\{[^{}]*\}/g, " WORDS ").replace(/(\d),(\d)/g, "$1.$2");
  for (const clause of t.split(/\\\\|\\Rightarrow|\\Leftrightarrow|\\implies|\\iff|⇒|⇔|;|,\s|\\quad|\\qquad|&|\\(?:begin|end)\{[a-z*]+\}|\\left|\\right|\\(?:approx|ne|neq|le|ge|leq|geq|lt|gt)\b|[<>≈≠≤≥]/)) {
    if (!clause.includes("=")) continue;
    const members = clause.split("=").map((p) => p.trim());
    let prev: { p: string; v: number } | null = null;
    for (const p of members) {
      const numeric = p && /\d/.test(p) && !/[A-Za-z]/.test(p.replace(/\\(?:frac|dfrac|tfrac|sqrt|cdot|times|div)/g, "")) && !/!|\^\s*\{?\s*\d{3,}/.test(p);
      let v: number | null = null;
      if (numeric) { try { v = evalExpression(p.replace(/\\div/g, "/"), {}); } catch { v = null; } }
      if (v === null || !Number.isFinite(v)) { prev = null; continue; }
      if (prev && Math.abs(prev.v - v) > 1e-9 + 0.006 * Math.max(Math.abs(prev.v), Math.abs(v))) out.push(`"${prev.p} = ${p}" is false: ${prev.p} = ${+prev.v.toFixed(6)}`);
      prev = { p, v };
    }
  }
  return out;
}

/**
 * "CF ⊥ AB và BK ⊥ AB nên CF ⊥ BK" (hanoi IV.1, served): two lines perpendicular to the same line are PARALLEL.
 * Prose and formulas are read with ⊥ / \perp / \bot and "vuông góc với".
 */
function perpendicularSlips(text: string): string[] {
  const t = text.replace(/\$/g, " ").replace(/\\perp|\\bot|vuông góc với/g, "⊥").replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, " $1 ").replace(/\s+/g, " ");
  const out: string[] = [];
  const re = /\b([A-Z]{2})\s*⊥\s*([A-Z]{2})\b[^.;]{0,40}?\b([A-Z]{2})\s*⊥\s*([A-Z]{2})\b[^.;]{0,20}?(?:nên|suy ra|⇒|\\Rightarrow|do đó)\s*(?:ta có\s*)?([A-Z]{2})\s*⊥\s*([A-Z]{2})\b/g;
  const same = (a: string, b: string) => a === b || a === [...b].reverse().join("");
  for (const m of t.matchAll(re)) {
    const [, a, l1, b, l2, x, y] = m;
    if (!same(l1!, l2!)) continue;
    if ((same(x!, a!) && same(y!, b!)) || (same(x!, b!) && same(y!, a!))) out.push(`"${a} ⊥ ${l1}, ${b} ⊥ ${l2} ⇒ ${x} ⊥ ${y}" is false: two lines perpendicular to the same line are parallel (${a} ∥ ${b})`);
  }
  return out;
}

const SELF_TALK = /(?<!\p{L})(?:chờ đã|khoan đã|à không|mình nhầm|kiểm tra lại kết quả (?:từ|của|bằng) máy|kết quả (?:tính )?(?:từ|bằng|của) máy|máy tính cho|theo máy|KẾT QUẢ TÍNH BẰNG MÁY|machine computation|wait|\(sai\)|theo dàn ý|dàn ý gốc|giả sử đáp án|đáp án thường là|thường là \d|trắc nghiệm phổ biến|dựa trên cấu trúc bài toán)(?!\p{L})/iu;

/** Feedback for false remainder claims and leaked working anywhere in the steps, hints and final answer. */
export function stepClaimFeedback(lesson: Pick<ModelLesson, "steps" | "hints" | "finalAnswer" | "strategy">): string[] {
  const out: string[] = [];
  const fields: [string, string | null][] = [
    ...lesson.steps.flatMap((s, i): [string, string | null][] => [[`step ${i + 1}`, s.explanation], [`step ${i + 1} formula`, s.math], [`step ${i + 1}`, s.title]]),
    ...lesson.hints.flatMap((h, i): [string, string | null][] => [[`hint ${i + 1}`, h.explanation], [`hint ${i + 1} formula`, h.math]]),
    ["final answer", lesson.finalAnswer.text], ["final answer formula", lesson.finalAnswer.math], ["strategy", lesson.strategy],
  ];
  for (const [where, text] of fields) {
    if (!text) continue;
    const mathParts = where.endsWith("formula") ? [text] : [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]!);
    for (const part of mathParts) for (const c of [...congruenceClaims(part), ...arithmeticClaims(part)]) out.push(`${where}: ${c}`);
    if (!where.endsWith("formula")) for (const c of proseRemainderClaims(text)) out.push(`${where}: ${c}`);
    for (const c of perpendicularSlips(text)) out.push(`${where}: ${c}`);
    for (const c of nonIntegerDivisibility(text)) out.push(`${where}: ${c}`);
    if (SELF_TALK.test(text)) out.push(`${where}: the lesson contains the solver's own working ("${SELF_TALK.exec(text)![0]}"); write only the clean solution, correct from the first step`);
  }
  return [...new Set(out)].slice(0, 8);
}

/**
 * Dead ends left in the solution (review 2026-10-15: "có cách gọn hơn", "sai lúc đầu xong sửa lại khúc cuối"): "Ta thử
 * cách khác", "Có vẻ như … chưa dẫn đến", a bound that "không thể đạt" followed by "cần một cách tiếp cận khác". The
 * mathematics may still be right, so this only asks for a rewrite (it never withholds the lesson).
 */
const DEAD_END = /\?\s*Không,|(?<!\p{L})(?:ta thử cách khác|hãy thử (?:một )?cách (?:tiếp cận )?khác|ta thử (?:một )?cách tiếp cận khác|cần (?:một )?cách (?:tiếp cận )?khác|có vẻ như (?:cách|hướng)|(?:cách này|sẽ) (?:rất )?phức tạp|chưa dẫn đến kết quả|không, hãy|không, cần|thử lại:|hãy cùng kiểm tra lại|tuy nhiên, cách đơn giản hơn)(?!\p{L})/iu;
export function deadEndFeedback(lesson: Pick<ModelLesson, "steps">): string[] {
  const hits = lesson.steps.flatMap((s, i) => { const m = DEAD_END.exec(`${s.explanation} ${s.math ?? ""}`); return m ? [`step ${i + 1} ("${m[0]}")`] : []; });
  return hits.length ? [`${hits.join(", ")}: the solution shows an abandoned attempt; write only the final, direct method from the first step (no "ta thử cách khác")`] : [];
}

/**
 * Review 2026-10-15 (geometry): "AL ∩ GJ = {P}" is not Grade 9 notation — write "P là giao điểm của AL và GJ". Asks for a
 * rewrite (never withholds the lesson).
 */
const SET_INTERSECTION = /\\cap|∩/;
export function intersectionNotationFeedback(lesson: Pick<ModelLesson, "steps" | "hints" | "finalAnswer">): string[] {
  const texts = [...lesson.steps.flatMap((s) => [s.explanation, s.math ?? ""]), ...lesson.hints.flatMap((h) => [h.explanation, h.math ?? ""]), lesson.finalAnswer.text, lesson.finalAnswer.math ?? ""];
  return texts.some((t) => SET_INTERSECTION.test(t)) ? ['set notation "∩" for an intersection: write "Gọi P là giao điểm của AL và GJ" / "AL và GJ cắt nhau tại P" instead of "AL ∩ GJ = {P}"'] : [];
}

/**
 * Review 2026-10-16: "Chia hết chỉ được dùng khi a và b là số nguyên" — "k^2 + k/n + 1 ⋮ k" (dividing a divisibility by
 * n²) is meaningless. A side of ⋮ / "chia hết cho" that contains a fraction with a letter in the denominator (k/n,
 * \frac{k}{n}) is not an integer expression. Fractions with a numeric denominator (n(n+1)/2) are left alone.
 */
function nonIntegerDivisibility(text: string): string[] {
  const t = text.replace(/\\dfrac|\\tfrac/g, "\\frac").replace(/\\left|\\right/g, "").replace(/\\(?:Rightarrow|Leftrightarrow|iff|implies|in|quad|qquad|text\{[^{}]*\})|\\\\/g, " ; ");
  const letterDenominator = /\\frac\{[^{}]*\}\{[^{}]*[a-zA-Z][^{}]*\}|\/\s*\(?[a-zA-Z]/;
  const out: string[] = [];
  for (const m of t.matchAll(/([^$=⇒⇔,;:]{1,60}?)\s*(?:\\vdots|⋮|\s(?:không\s)?chia hết cho\s)\s*([^$=⇒⇔,;.\s]{1,30})/gu)) {
    const [, left, right] = m;
    if (letterDenominator.test(left!) || letterDenominator.test(right!)) out.push(`"${m[0]!.trim()}": divisibility (⋮, "chia hết cho") is only defined between integers; this side has a fraction with a variable denominator. Work with an integer relation instead (e.g. keep k^2n^2 + kn + n^2 ⋮ kn^2 and use n ⋮ k)`);
  }
  return out;
}

/**
 * Review 2026-10-16: hints are pieces of the solution, not questions ("…không?", "Làm thế nào…") that confuse, and they
 * never give away the answer — the student must find it. Asks for a rewrite (never withholds the lesson).
 */
export const QUESTION_HINT = /\?\s*$|^(?:làm thế nào|vì sao|tại sao|có thể|liệu|em hãy nghĩ|hãy suy nghĩ|bạn có|bạn hãy thử|thử nghĩ)/iu;
export function hintFeedback(lesson: Pick<ModelLesson, "hints" | "finalAnswer" | "analysis">): string[] {
  const out: string[] = [];
  const questions = lesson.hints.filter((h) => QUESTION_HINT.test(h.question.trim())).map((h) => h.id);
  if (questions.length) out.push(`hint ${questions.join(", ")}: a hint is a short statement of the next idea of the solution (shown as its title), not a question — e.g. "Biến đổi về dạng tích …", "Dùng hệ thức Vi-ét …"`);
  // The final value itself ("= 70", "$m=0$ hoặc $m=\\frac52$", "là $6+2\\sqrt3$") may not appear in a hint as a result.
  const norm = (t: string) => t.replace(/\$/g, "").replace(/\\[dt]?frac/g, "\\frac").replace(/\\left|\\right|\\,|\\;|\s+/g, "").replace(/\{(\w)\}/g, "$1");
  const fin = `${lesson.finalAnswer.math ?? ""} ${lesson.finalAnswer.text}`;
  const values = [...fin.replace(/\$/g, " ").matchAll(/(?:=|\blà|bằng)\s*([^,;:\n]+?)(?=\s*(?:$|[,;:\n]|\s(?:và|hoặc|cm|cách|đạt|khi)\b|\.\s|\.$))/gu)].map((m) => norm(m[1]!)).filter((v) => v.length >= 1 && !/^[01]$/.test(v) && !norm(lesson.analysis.statement).includes(`=${v}`));
  if (values.length) {
    const leaks = lesson.hints.filter((h) => { const shown = norm(`${h.question} ${h.cue ?? ""} ${h.explanation} ${h.math ?? ""}`); return values.some((v) => new RegExp(`(?:=|là|bằng)${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9])`).test(shown)); }).map((h) => h.id);
    if (leaks.length) out.push(`hint ${leaks.join(", ")}: shows the final answer (${values.join(", ")}); a hint gives the next idea, the student finds the answer`);
  }
  return out;
}
