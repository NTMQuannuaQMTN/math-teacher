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

/** Replaces known Chinese insertions in Vietnamese text and tidies the spacing they leave. */
export function patchVietnamese(text: string): string {
  if (!CJK.test(text)) return text;
  let out = text;
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
  const fix = <T extends string | null>(t: T): T => (vi && t ? (patchVietnamese(t) as T) : t);
  const lesson: ModelLesson = vi
    ? {
        ...input,
        strategy: fix(input.strategy),
        finalAnswer: { ...input.finalAnswer, text: fix(input.finalAnswer.text) },
        hints: input.hints.map((h) => ({ ...h, question: fix(h.question), cue: fix(h.cue), explanation: fix(h.explanation) })),
        steps: input.steps.map((st) => ({ ...st, title: fix(st.title), explanation: fix(st.explanation), reason: fix(st.reason) })),
      }
    : input;
  const a = lesson.analysis;
  const keep = (items: string[]) => (vi ? items.filter((t) => !isStrippedVietnamese(t)) : items);
  const analysis = {
    ...a,
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
