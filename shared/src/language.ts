import type { ModelLesson } from "./solution";

/**
 * Deterministic language hygiene for model lessons. Hosted models sometimes drift: Vietnamese written
 * without diacritics ("phuong trinh"), a phrase in Chinese inside a Vietnamese hint, or an English
 * "no corrections needed" note.
 */

const CJK = /[぀-ヿ㐀-鿿豈-﫿＀-￯]/u;
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

/** True when the text reads as Vietnamese with its diacritics missing (maths is ignored). */
export function isStrippedVietnamese(text: string): boolean {
  const prose = text.replace(/\$[^$]*\$/g, " ");
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
  [/\bsemelhantes?\b/giu, "đồng dạng"],
  [/\bquais\b/giu, "những"],
  [/\bfactors?\b/giu, "nhân tử"],
  [/\bfator(es)?\b/giu, "nhân tử"],
  // The 3×3 magic square has a Vietnamese name; "Lo Shu" means nothing to a Vietnamese student.
  [/(hình\s+)?vuông\s+ma\s+Lo\s*Shu/giu, "ma phương 3 × 3"],
  [/(ma phương|bảng)\s+Lo\s*Shu/giu, "$1"],
  [/\bLo\s*Shu\b/giu, "ma phương 3 × 3"],
  [/(?<=\p{L})Known\b/gu, " đã biết"],
  [/\bKnown\b/gu, "đã biết"],
];

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
  if (WORD_GLOSSARY.some(([re]) => ((re.lastIndex = 0), re.test(text)))) {
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
    vi && t ? (simplifyNotation(t.replace(/(vuông\s+ma\s+)?Lo\s*Shu/giu, "ma phương 3 × 3")) as T) : t;
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
  const keep = (items: string[]) => (vi ? items.filter((t) => !isStrippedVietnamese(t)) : items);
  const analysis = {
    ...a,
    // Shown as "Dạng bài": only when it is proper Vietnamese (models often leave it in English or without diacritics).
    subtopic: vi && !VI_MARKED.test(a.subtopic) ? "" : a.subtopic,
    concepts: keep(a.concepts),
    givens: keep(a.givens),
    unknowns: keep(a.unknowns),
    constraints: keep(a.constraints),
    interpretationNotes: a.interpretationNotes.filter((n) => !NO_OP_NOTE.test(n) && !(vi && isStrippedVietnamese(n))),
  };

  const body: [string, string | null][] = [
    ["strategy", lesson.strategy],
    ["final answer", lesson.finalAnswer.text],
    ...lesson.hints.flatMap((h): [string, string | null][] => [
      [`hint ${h.id}`, h.question],
      [`hint ${h.id}`, h.cue],
      [`hint ${h.id}`, h.explanation],
    ]),
    ...lesson.steps.flatMap((s): [string, string | null][] => [
      [`step ${s.id}`, s.title],
      [`step ${s.id}`, s.explanation],
      [`step ${s.id}`, s.reason],
    ]),
  ];
  const feedback: string[] = [];
  const foreign = [...new Set(body.filter(([, t]) => t && CJK.test(t)).map(([where]) => where))];
  if (foreign.length > 0) {
    feedback.push(`${foreign.join(", ")} contain(s) Chinese/Japanese characters: write every student-facing text only in the problem's language`);
  }
  const stripped = vi ? [...new Set(body.filter(([, t]) => t && isStrippedVietnamese(t)).map(([where]) => where))] : [];
  if (stripped.length > 0) {
    feedback.push(`${stripped.join(", ")} is Vietnamese without diacritics: write Vietnamese with full diacritics ("phương trình", never "phuong trinh")`);
  }
  return { lesson: { ...lesson, analysis }, feedback };
}
