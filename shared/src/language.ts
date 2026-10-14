import type { ModelLesson } from "./solution";
import {hasDamagedLatex} from './mathText';

/**
 * Deterministic language hygiene for model lessons. Hosted models sometimes drift: Vietnamese written
 * without diacritics ("phuong trinh"), a phrase in Chinese inside a Vietnamese hint, or an English
 * "no corrections needed" note.
 */

const CJK = /[぀-ヿ㐀-鿿豈-﫿＀-￯]/u;
const CYRILLIC = /[А-Яа-яЁёЪъЫыЭэЮю]/u;
// Reject letters in every non-Latin script, including Thai, Arabic and Hangul.
// Mathematical symbols and digits remain valid; script detection does not identify all foreign Latin words.
// Greek letters are mathematical notation in Vietnamese textbooks (Δ for the discriminant, π, α), not a foreign language.
const NON_LATIN_LETTER = /(?=\p{L})(?!\p{Script=Latin})(?!\p{Script=Greek})\P{Script=Common}/u;
const FOREIGN_LATIN = /[äëïöüÿßñçğışřšžčł]/iu;
/** Letters that only appear in Vietnamese written with its diacritics. */
const VI_MARKED = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu;
/** Common Vietnamese syllables as they look with their diacritics stripped. */
const VI_STRIPPED = new Set(
  (
    "phuong trinh nghiem biet thuc dieu kien dieukien cong chung minh tinh tim gia tri duong tron giac vuong " +
    "cua hai mot nhung khong duoc thi neu vay voi cac bang hang ham bac tham phan diem doan thang canh goc " +
    "dang tong hieu tich thuong bieu cho rang luon moi nao deu nhau sao"
  ).split(" "),
);
// A marked phrase elsewhere in the field must not hide an unaccented mathematical phrase.
// These pairs are unambiguous; ordinary Vietnamese words such as "cho hai" remain valid.
const STRIPPED_MATH_PHRASE=/(?<!\p{L})(?:phuong trinh|dieu kien|gia tri|ket luan|biet thuc|binh phuong|cong thuc|so nguyen|dau bang|luy thua|giai thich|hai nghiem|nghiem thuc)(?!\p{L})/iu;

/** True when the text reads as Vietnamese with its diacritics missing (maths is ignored). */
export function isStrippedVietnamese(text: string): boolean {
  const prose = text.replace(/\$[^$]*\$/g, " ");
  if (STRIPPED_MATH_PHRASE.test(prose)) return true;
  if (VI_MARKED.test(prose)) return false;
  const words = prose.toLowerCase().match(/\p{L}{2,}/gu) ?? [];
  const hits = words.filter((w) => VI_STRIPPED.has(w)).length;
  return hits >= 2 && hits / words.length >= 0.4;
}

/**
 * Chinese words Nemotron drops into Vietnamese sentences (measured on EXP-010), with the Vietnamese
 * wording for each context. Longest patterns first. Anything not covered is sent back as feedback.
 */
const CJK_GLOSSARY: [RegExp, string][] = [
  [/để\s*得到/gu, "để có"],
  [/vừa\s*得到/gu, "vừa có"],
  [/得到/gu, " được "],
  [/什么样的表达式|什么表达式/gu, " biểu thức nào "],
  [/简单(的)?表达式/gu, " biểu thức đơn giản hơn "],
  [/表达式/gu, " biểu thức "],
  [/求/gu, " tìm "],
  [/成比例/gu, " tỉ lệ "],
  [/因子/gu, " thừa số "],
  [/[項项]/gu, " hạng tử "],
  [/議論|议论|论证/gu, " lập luận "],
  [/边/gu, " cạnh "],
  [/角/gu, " góc "],
  [/[，]/gu, ", "],
  [/[。]/gu, ". "],
  [/[？]/gu, "? "],
  [/[：]/gu, ": "],
];

/** English / Portuguese words Nemotron drops into Vietnamese prose (EXP-010 review). Maths stays untouched. */
const WORD_GLOSSARY: [RegExp, string][] = [
  [/đã\s+given\b/giu, "đã cho"],
  [/\bgiven\b/giu, "đã cho"],
  [/\bfor\b/giu, "cho"],
  [/\band\b/giu, "và"],
  [/\btherefore\b/giu, "suy ra"],
  [/(?<!\p{L})so(?!\p{L})(?!\s+(?:sánh|với|đo|kè)(?!\p{L}))/giu, "do đó"],
  [/\bwe\s+have\b/giu, "ta có"],
  [/\bhas\b/giu, "có"],
  [/\bfind\b/giu, "tìm"],
  [/\bcalculate\b/giu, "tính"],
  [/\bpositive\b/giu, "dương"],
  [/\bnegative\b/giu, "âm"],
  [/\bsemelhantes?\b/giu, "đồng dạng"],
  [/\bquais\b/giu, "những"],
  [/\bfactors?\b/giu, "nhân tử"],
  [/\bfator(es)?\b/giu, "nhân tử"],
  // The 3×3 magic square has a Vietnamese name; "Lo Shu" means nothing to a Vietnamese student.
  [/(hình\s+)?vuông\s+ma\s+Lo\s*Shu/giu, "ma phương 3 × 3"],
  [/(ma phương|bảng)\s+Lo\s*Shu/giu, "$1"],
  [/\bLo\s*Shu\b/giu, "ma phương 3 × 3"],
  [/(?<!\p{L})vuông\s+ma(?!\p{L})/giu, "ma phương"],
  [/(?<=\p{L})Known\b/gu, " đã biết"],
  [/\bKnown\b/giu, "đã biết"],
  // PTNK 2025 review: English glued to Vietnamese, and calques of English terms.
  [/(?<=\p{Ll})Strict(ly)?\b/gu, ""],
  [/\bcorresponding\b/giu, "tương ứng"],
  [/\brespectively\b/giu, "lần lượt"],
  [/\bcongruence\b/giu, "đồng dư"],
  [/\blcm\b/giu, "bội chung nhỏ nhất"],
  [/\bmodulo\b/giu, "khi chia cho"],
  [/\bfavorable\/total\b/giu, "số kết quả thuận lợi / tổng số kết quả"],
  [/không\s+remettre/giu, "không hoàn lại"],
  [/\bdifférence\b/giu, "hiệu"],
  [/\bsynthesis\b/giu, "tổng hợp"],
  [/\bAM-GM\b/giu, "Cô-si"],
  [/nguyên lý phong bụ/giu, "nguyên lí Dirichlet"],
  [/hạng tử đồng loại/giu, "hạng tử đồng dạng"],
  [/\bphép mở rộng\b/giu, "khai triển"],
  [/\bhạn chế dưới\b/giu, "chặn dưới"],
];

/** English (or other foreign) words left in Vietnamese prose after the glossary: sent back to the model. */
const FOREIGN_WORDS =
  /(?<![\p{L}\\])(?:razionale|rationale|rationalization|injective|surjective|bijective|strict(?:ly)?|with|where|therefore|hence|such that|increasing|decreasing|function|system|vs|against|substitute into formula|feit|diferen\p{L}*|vše)(?!\p{L})|\p{Ll}[A-Z][a-z]{2,}/u;

/** Unambiguous English words in prose; avoid words shared with Vietnamese (An, do, so, to, ...). */
const ENGLISH_PROSE = /(?<![\p{L}\\])(?:game|games|theory|winning|losing|positions?|strategy|induction|backward|reasoning|initial|states?|rules?|players?|turns?|each|choose|piles?|remove|integer|stones?|last|take|wins?|logical|deduction|arithmetic|transition|symmetry|argument|termination|manual|analysis|verified|proof|definition|moves?|parity|integers|grid|piece|starts?|adjacent|cell|right|cannot|loses?|board|size|condition|winner|problem|asks?|which|explicitly|covered|standard|curriculum|defined|knowledge|base|involves|specific|framework|impartial|sprague|grundy|often|considered|logic|puzzle|rather|the|are|and|then|that|this|you|your|after|before|when|only|both|every)(?!\p{L})/iu;

/** Streaming previews need the same script/word checks before a complete
 * typed lesson is available. Mathematical command names are not prose. */
export function hasForeignDisplayText(text:string):boolean {
 const prose=text.replace(/\$[^$]*\$/g,' '),mathWords=[...text.matchAll(/\\text\{([^{}]*)\}/g)].map(m=>m[1]!).join(' ');
 return NON_LATIN_LETTER.test(text)||FOREIGN_LATIN.test(prose+' '+mathWords)||FOREIGN_WORDS.test(prose+' '+mathWords)||ENGLISH_PROSE.test(prose+' '+mathWords);
}

/** A common but invalid shortcut: treating three expressions as exactly the set {1,2,3}
 * when the statement only says the three values are 1, 2, 3 in some order. */
const INVALID_UNORDERED_SET_EQUALITY = /\{[^{}$]{1,160},[^{}$]{1,160}(?:,[^{}$]{1,160})?\}\s*=\s*\{\s*[-+]?\d+(?:\s*[,;]\s*[-+]?\d+){1,8}\s*\}/u;

/**
 * School notation: two residues that form one class modulo half the modulus are one condition
 * ("n ≡ 0 hoặc 2 (mod 4)" is "n ≡ 0 (mod 2)", i.e. n chẵn; "≡ 16 hoặc 34 (mod 36)" is "≡ 16 (mod 18)").
 * Works on prose (≡ … (mod m)) and LaTeX (\equiv … \pmod{m}). Logic symbols become words.
 */
export function simplifyNotation(text: string): string {
  const join = String.raw`\s*(?:\\text\{\s*(?:hoặc|or)\s*\}|hoặc|or|;|,)\s*`;
  const mod = String.raw`\s*(?:\\pmod\{?\s*(\d+)\s*\}?|\\?\(?\s*(?:\\bmod|\\mod|\\text\{\s*mod\s*\}|mod)\s*\{?\s*(\d+)\s*\}?\s*\\?\)?)`;
  const re = new RegExp(String.raw`(?:([a-zA-Z])\s*)?(≡|\\equiv)\s*(\d+)${join}(\d+)${mod}`, "gu");
  let out = text.replace(re, (whole: string, v: string | undefined, eq: string, a: string, b: string, m1?: string, m2?: string) => {
    const m = Number(m1 ?? m2);
    const [r1, r2] = [Number(a), Number(b)].sort((x, y) => x - y) as [number, number];
    if (!(m > 0 && m % 2 === 0 && r2 - r1 === m / 2 && r2 < m)) return whole;
    const half = m / 2;
    const latex = eq.startsWith("\\");
    const lhs = v ? `${v} ` : "";
    const cond = latex ? `${lhs}${eq} ${r1} \\pmod{${half}}` : `${lhs}≡ ${r1} (mod ${half})`;
    return half === 2 && !latex ? `${cond}, tức là ${v ? `${v} ` : ""}${r1 === 0 ? "chẵn" : "lẻ"}` : cond;
  });
  out = out.replace(/\s*(\\land|\\wedge|∧)\s*/gu, (_: string, s: string) => (s.startsWith("\\") ? " \\text{ và } " : " và "));
  out = out.replace(/\s*(\\lor|\\vee|∨)\s*/gu, (_: string, s: string) => (s.startsWith("\\") ? " \\text{ hoặc } " : " hoặc "));
  return out;
}

/** Replaces known foreign insertions in Vietnamese text and tidies the spacing they leave. */
export function patchVietnamese(text: string): string {
  let out = text;
  // Global regexes keep lastIndex between .test() calls: reset it, or a later string can be missed.
  if (!isStrippedVietnamese(text) && WORD_GLOSSARY.some(([re]) => ((re.lastIndex = 0), re.test(text)))) {
    // Only outside $…$: a variable could be called "factor" in maths.
    out = out.replace(/(\$[^$]*\$)|([^$]+)/g, (m, math: string | undefined) => (math ? m : WORD_GLOSSARY.reduce((t, [re, vi]) => t.replace(re, vi), m)));
  }
  // A replacement at the start of a sentence keeps the capital letter.
  out = out.replace(/(^|[.!?]\s+)(ma phương|nhân tử|đồng dạng)/gu, (_m, pre: string, w: string) => pre + w[0]!.toUpperCase() + w.slice(1));
  if (!CJK.test(out)) return out;
  for (const [re, vi] of CJK_GLOSSARY) out = out.replace(re, vi);
  return out.replace(/[ \t]{2,}/g, " ").replace(/ ([.,?:])/g, "$1").replace(/ +$/gm, "");
}

/** An interpretation note that reports nothing ("clear", "no OCR corrections needed"). */
const NO_OP_NOTE = /\b(no (ocr )?(corrections?|errors?|ambiguity|issues?)|is clear|clear and complete)\b|không có lỗi|không cần (sửa|chỉnh)|đề (bài )?(đã )?rõ ràng/iu;

export interface LanguageResult {
  lesson: ModelLesson;
  /** Problems worth a retry (the lesson body itself is in the wrong language or script). */
  feedback: string[];
}

export function cleanLanguage(input: ModelLesson): LanguageResult {
  const vi = input.analysis.language === "vi";
  const fix = <T extends string | null>(t: T): T => (vi && t ? (simplifyNotation(patchVietnamese(t)) as T) : t);
  const fixMath = <T extends string | null>(t: T): T =>
    vi && t ? (simplifyNotation(t.replace(/(vuông\s+ma\s+)?Lo\s*Shu/giu, "ma phương 3 × 3").replace(/\\text\{([^{}]*)\}/g, (_m,words:string)=>`\\text{${patchVietnamese(words).replace(/\bvs\b/giu,'và')}}`)) as T) : t;
  const lesson: ModelLesson = vi
    ? {
        ...input,
        strategy: fix(input.strategy),
        finalAnswer: { ...input.finalAnswer, text: fix(input.finalAnswer.text), math: fixMath(input.finalAnswer.math) },
        hints: input.hints.map((h) => ({ ...h, question: fix(h.question), cue: fix(h.cue), explanation: fix(h.explanation), math: fixMath(h.math) })),
        steps: input.steps.map((st) => ({ ...st, title: fix(st.title), explanation: fix(st.explanation), reason: fix(st.reason), math: fixMath(st.math) })),
      }
    : input;
  const a = lesson.analysis;
  // Never remove a hypothesis just because its accents are missing. Preserve it for corrective
  // feedback rather than allowing a solution with silently weakened displayed conditions.
  const keep = (items: string[]) => items.map((t) => fix(t));
  const analysis = {
    ...a,
    // Shown as "Dạng bài": only when it is proper Vietnamese (models often leave it in English or without diacritics).
    subtopic: fix(a.subtopic),
    concepts: keep(a.concepts),
    givens: keep(a.givens),
    unknowns: keep(a.unknowns),
    constraints: keep(a.constraints),
    interpretationNotes: a.interpretationNotes.filter((n) => !NO_OP_NOTE.test(n)).map((n) => fix(n)),
  };

  const body: [string, string | null][] = [
    ["statement", analysis.statement],
    ["subtopic", analysis.subtopic],
    ["status reason", analysis.statusReason],
    ...analysis.concepts.map((t): [string, string] => ["concept", t]),
    ...analysis.givens.map((t): [string, string] => ["given", t]),
    ...analysis.unknowns.map((t): [string, string] => ["unknown", t]),
    ...analysis.constraints.map((t): [string, string] => ["constraint", t]),
    ...analysis.interpretationNotes.map((t): [string, string] => ["interpretation note", t]),
    ["strategy", lesson.strategy],
    ["final answer", lesson.finalAnswer.text],
    ["final answer math", lesson.finalAnswer.math],
    ...lesson.hints.map((h): [string, string | null] => [`hint ${h.id} math`, h.math]),
    ...lesson.steps.flatMap((s): [string, string | null][] => [[`step ${s.id} math`, s.math], [`step ${s.id} result`, s.result ?? null]]),
    ...lesson.hints.flatMap((h): [string, string | null][] => [
      [`hint ${h.id}`, h.question],
      [`hint ${h.id}`, h.cue],
      [`hint ${h.id}`, h.explanation],
    ]),
    ...lesson.steps.flatMap((s): [string, string | null][] => [
      [`step ${s.id}`, s.title],
      [`step ${s.id}`, s.explanation],
      [`step ${s.id}`, s.reason],
      [`step ${s.id} operation`, s.operation ?? null],
      [`step ${s.id} verification method`, s.verification?.method ?? null],
      [`step ${s.id} verification reason`, s.verification?.reason ?? null],
      ...(s.factsUsed ?? []).map((t): [string, string] => [`step ${s.id} fact`, t]),
    ]),
    ...(lesson.figure?.points ?? []).map((p): [string, string] => ["point label", p.label]),
    ...(lesson.figure?.lines ?? []).map((l): [string, string | null] => ["line label", l.label]),
    ...(lesson.figure?.circles ?? []).map((c): [string, string | null] => ["circle label", c.label]),
    ...(lesson.figure?.angles ?? []).map((a): [string, string | null] => ["angle label", a.label]),
  ];
  const feedback: string[] = [];
  const damaged=[...new Set(body.filter(([,t])=>t&&hasDamagedLatex(t)).map(([where])=>where))];
  if(damaged.length)feedback.push(`${damaged.join(', ')}: damaged LaTeX escape or fused imes fragment; rewrite the original mathematical expression with properly escaped commands, never guess missing operators`);
  if (!vi) feedback.push('English or mixed-language lesson metadata: all displayed explanations must be in Vietnamese with full diacritics; rewrite and set language vi');
  const otherScript = vi ? [...new Set(body.filter(([, t]) => t && NON_LATIN_LETTER.test(t)).map(([where]) => where))] : [];
  if (otherScript.length) feedback.push(`${otherScript.join(", ")}: foreign non-Latin letters in displayed fields; rewrite in Vietnamese`);
  const foreign = [...new Set(body.filter(([, t]) => t && CJK.test(t)).map(([where]) => where))];
  if (foreign.length > 0) {
    feedback.push(`${foreign.join(", ")} contain(s) Chinese/Japanese characters: write every student-facing text only in the problem's language`);
  }
  const russian = [...new Set(body.filter(([, t]) => t && CYRILLIC.test(t)).map(([where]) => where))];
  if (russian.length > 0) {
    feedback.push(`${russian.join(", ")} contain(s) Cyrillic/Russian text: rewrite every student-facing text in Vietnamese with full diacritics`);
  }
  // Prose outside $…$, plus the words inside \text{…} of the maths fields.
  const prose = (t: string) => t.replace(/\$[^$]*\$/g, " ");
  const texts = (m: string | null) => [...(m ?? "").matchAll(/\\text\{([^{}]*)\}/g)].map((x) => x[1]).join(" ");
  const withMath: [string, string | null][] = [
    ...body,
    ...body.map(([where, t]): [string, string] => [where, texts(t)]),
    ["final answer math", texts(lesson.finalAnswer.math)],
    ...lesson.steps.flatMap((s): [string, string | null][] => [[`step ${s.id}`, texts(s.math)], [`step ${s.id} result`, texts(s.result ?? null)]]),
    ...lesson.hints.map((h): [string, string | null] => [`hint ${h.id}`, texts(h.math)]),
  ];
  const foreignLatin = vi ? [...new Set(withMath.filter(([, t]) => t && FOREIGN_LATIN.test(prose(t))).map(([where]) => where))] : [];
  if (foreignLatin.length) feedback.push(`${foreignLatin.join(", ")}: foreign Latin-script words in a Vietnamese lesson; rewrite in natural Vietnamese with full diacritics`);
  const english = vi ? [...new Set(withMath.flatMap(([where, t]) => { const m = t ? FOREIGN_WORDS.exec(prose(t)) ?? ENGLISH_PROSE.exec(prose(t)) : null; return m ? [`${where} ("${m[0]}")`] : []; }))] : [];
  if (english.length > 0) {
    feedback.push(`${english.join(", ")}: English or other foreign words in a Vietnamese lesson — write them in Vietnamese ("đồng biến", "tương ứng", "với"), using only terms a Grade 9 student knows`);
  }
  const invalidSet = vi
    ? [...new Set(withMath.filter(([, t]) => {
        if (!t) return false;
        const plainNotation = t.replace(/\\(?:left|right|big|Big|bigg|Bigg|quad|qquad)\b|\\[,;! ]/g,'').replace(/\$/g, "").replace(/\\/g, "");
        return INVALID_UNORDERED_SET_EQUALITY.test(plainNotation);
      }).map(([where]) => where))]
    : [];
  if (invalidSet.length > 0) {
    feedback.push(`${invalidSet.join(", ")}: invalid unordered-set equality; state that the expressions take the listed values in some order, or split into explicit cases`);
  }
  const stripped = vi ? [...new Set(body.filter(([, t]) => t && isStrippedVietnamese(t)).map(([where]) => where))] : [];
  if (stripped.length > 0) {
    feedback.push(`${stripped.join(", ")} is Vietnamese without diacritics: write Vietnamese with full diacritics ("phương trình", never "phuong trinh")`);
  }
  return { lesson: { ...lesson, analysis }, feedback };
}
