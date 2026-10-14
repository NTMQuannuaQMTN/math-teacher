import { algebraProofLesson, type AlgebraDeduction } from "../algebraProofLesson";
import { integerPolynomial } from "../../../../shared/src/integerPolynomial";
import { flatten, gcd, isqrt } from "./text";
import type { RoutineResult } from "./numberTheory";

/** Exact rationals for the algebra routines. */
interface Q { p: bigint; q: bigint }
const q = (p: bigint, d = 1n): Q => { if (d < 0n) { p = -p; d = -d; } const g = gcd(p, d) || 1n; return { p: p / g, q: d / g }; };
const add = (a: Q, b: Q) => q(a.p * b.q + b.p * a.q, a.q * b.q), sub = (a: Q, b: Q) => q(a.p * b.q - b.p * a.q, a.q * b.q);
const mul = (a: Q, b: Q) => q(a.p * b.p, a.q * b.q), div = (a: Q, b: Q) => q(a.p * b.q, a.q * b.p);
const tex = (a: Q) => (a.q === 1n ? `${a.p}` : `${a.p < 0n ? "-" : ""}\\frac{${a.p < 0n ? -a.p : a.p}}{${a.q}}`);
const val = (a: Q) => Number(a.p) / Number(a.q);
const lessonOf = (text: string, subtopic: string, strategy: string, details: AlgebraDeduction[], final: string, meta: { givens: string[]; unknowns: string[] }) =>
  algebraProofLesson(text, subtopic, strategy, details, final, { topic: "algebra", ...meta });
const singleTask = (t: string) => !/(?:^|\s)[a-e]\)|\bcâu\s+[a-e]\b/i.test(t);
const signedTerm = (c: Q, body: string) => (c.p === 0n ? "" : `${c.p < 0n ? "-" : "+"}${c.q === 1n && (c.p === 1n || c.p === -1n) && body ? "" : tex(q(c.p < 0n ? -c.p : c.p, c.q))}${body}`);

// --------------------------------------------------------------------------------- extremum of a quadratic in x
/** "Tìm giá trị nhỏ nhất/lớn nhất của A = ax²+bx+c" (x real, no other condition): completing the square. */
export function quadraticExtremumLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const wantMin = /giá trị nhỏ nhất|GTNN|minimum/i.test(t), wantMax = /giá trị lớn nhất|GTLN|maximum/i.test(t);
  if (wantMin === wantMax) return null;
  if (/[<>≤≥]|với\s+[a-z]\s*(?:thuộc|∈)|đoạn|khoảng|x\s*>/i.test(t.replace(/với x thực|với mọi x|x∈R/gi, ""))) return null;
  const m = /(?:của(?: biểu thức| đa thức| hàm số)?\s+(?:[A-Z]\s*(?:\(x\))?=)?|[A-Z](?:\(x\))?=)([0-9x^+\-*() ]+?)(?:\.|,|$| với| khi)/i.exec(t);
  if (!m) return null;
  const expr = m[1]!.replace(/\s+/g, "");
  const p = integerPolynomial(expr, "x");
  if (!p || p.coefficients.length !== 3) return null;
  const [c0, b0, a0] = p.coefficients.map((v) => q(v)) as [Q, Q, Q];
  if ((a0.p > 0n) !== wantMin) return null; // asks for an extremum that doesn't exist: leave it to the model
  // a(x + b/2a)² + (c − b²/4a)
  const h = div(b0, mul(q(2n), a0)), k = sub(c0, div(mul(b0, b0), mul(q(4n), a0)));
  const x0 = q(-h.p, h.q);
  const name = /([A-Z])(?:\(x\))?=/.exec(t)?.[1] ?? "A";
  const sq = h.p === 0n ? "x^2" : `\\left(x${h.p < 0n ? "-" : "+"}${tex(q(h.p < 0n ? -h.p : h.p, h.q))}\\right)^2`;
  const aPart = a0.p === 1n && a0.q === 1n ? "" : a0.p === -1n && a0.q === 1n ? "-" : tex(a0);
  const form = `${aPart}${sq}${signedTerm(k, "")}`;
  const details: AlgebraDeduction[] = [
    { title: "Biến đổi về dạng bình phương", explanation: `Ta thêm bớt để xuất hiện hằng đẳng thức $(x+u)^2=x^2+2ux+u^2$ (hoàn thành bình phương). Khai triển vế phải để kiểm tra lại.`, math: `${name}=${expr.replace(/\*/g, "")}=${form}`, reason: "Hằng đẳng thức bình phương của một tổng/hiệu", question: "Thêm bớt số nào để được một bình phương?" },
    { title: wantMin ? "Đánh giá từ dưới" : "Đánh giá từ trên", explanation: `Vì $${sq}\\ge 0$ với mọi $x$ ${wantMin ? "nên" : `và hệ số $${tex(a0)}<0$ nên $${aPart}${sq}\\le 0$, do đó`} $${name}${wantMin ? "\\ge" : "\\le"}${tex(k)}$ với mọi số thực $x$.`, math: `${name}${wantMin ? "\\ge" : "\\le"} ${tex(k)}`, reason: "Bình phương của một số thực không âm", question: "Bình phương nhỏ nhất bằng bao nhiêu?" },
    { title: "Chỉ ra dấu bằng xảy ra", explanation: `Dấu bằng xảy ra khi và chỉ khi bình phương bằng $0$, tức $x=${tex(x0)}$. Thay lại: $${name}=${tex(k)}$. Một giá trị chỉ là ${wantMin ? "nhỏ nhất" : "lớn nhất"} khi vừa là cận vừa đạt được.`, math: `x=${tex(x0)}\\ \\Rightarrow\\ ${name}=${tex(k)}`, reason: "Điều kiện dấu bằng", question: "Khi nào bình phương bằng 0?" },
  ];
  const final = `Vậy giá trị ${wantMin ? "nhỏ nhất" : "lớn nhất"} của $${name}$ là $${tex(k)}$, đạt được khi $x=${tex(x0)}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Giá trị lớn nhất, nhỏ nhất của tam thức bậc hai", "Hoàn thành bình phương, dùng bình phương không âm, chỉ ra dấu bằng.", details, final, { givens: [`$${name}=${expr}$`], unknowns: [`Giá trị ${wantMin ? "nhỏ nhất" : "lớn nhất"}`] });
  const f = (x: number) => val(a0) * x * x + val(b0) * x + val(c0);
  const verify = () => {
    // identity on several points, value at x0, and the bound on a grid
    for (const x of [-3, -1, 0, 0.5, 2, 7]) if (Math.abs(f(x) - (val(a0) * (x + val(h)) ** 2 + val(k))) > 1e-9) return false;
    if (Math.abs(f(val(x0)) - val(k)) > 1e-9) return false;
    for (let x = -50; x <= 50; x += 0.25) if (wantMin ? f(x) < val(k) - 1e-9 : f(x) > val(k) + 1e-9) return false;
    return true;
  };
  return lesson ? { lesson, verify, label: "Kiểm tra đẳng thức bình phương tại nhiều điểm, giá trị tại điểm đạt và cận trên lưới", family: "quadratic-extremum" } : null;
}

// ------------------------------------------------------------------------ parameter: number of roots of a quadratic
/** "Cho phương trình ax²+bx+c=0 (m là tham số). Tìm m để phương trình có hai nghiệm phân biệt / có nghiệm kép / vô nghiệm / có nghiệm",
 *  with a, b, c linear in m and a a non-zero constant. */
export function discriminantConditionLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/tham số|tìm m|tìm (?:các |tất cả )?giá trị (?:của )?m/i.test(t)) return null;
  const kind = /hai nghiệm phân biệt/i.test(t) ? "distinct" : /nghiệm kép/i.test(t) ? "double" : /vô nghiệm/i.test(t) ? "none" : /có nghiệm/i.test(t) ? "some" : null;
  if (!kind || /x_1|x_2|x1|x2|thỏa|dương|âm|trái dấu|cùng dấu|lớn hơn|nhỏ hơn/i.test(t)) return null;
  const eq = /([0-9xm^+\-*() ]+)=0/.exec(t);
  if (!eq) return null;
  const e = eq[1]!.replace(/\s+/g, "");
  // Coefficients of x as polynomials in m: sample m to read them off exactly (each must be linear or quadratic in m).
  const coeffAt = (mv: number) => { const p = integerPolynomial(e.replace(/m/g, `(${mv})`), "x"); return p && p.coefficients.length === 3 ? p.coefficients : null; };
  const samples = [0, 1, 2, 3].map(coeffAt);
  if (samples.some((s) => !s)) return null;
  const S = samples as bigint[][];
  // Δ' or Δ as a polynomial in m (degree ≤ 2), fitted exactly through 4 samples (third differences must vanish).
  const disc = S.map(([c, b, a]) => b! * b! - 4n * a! * c!);
  const d1 = disc.map((v, i) => (i ? v - disc[i - 1]! : 0n)).slice(1), d2 = d1.map((v, i) => (i ? v - d1[i - 1]! : 0n)).slice(1);
  if (d2[0] !== d2[1]) return null;
  if (S.some(([, , a]) => a !== S[0]![2]) || S[0]![2] === 0n) return null; // leading coefficient must be a constant ≠ 0
  const A2 = d2[0]! / 2n, B1 = d1[0]! - A2, C0 = disc[0]!; // disc(m) = A2 m² + B1 m + C0
  if (A2 !== 0n) return null; // keep to a linear condition in m (the usual school case)
  if (B1 === 0n) return null;
  // Δ' when b is even for every m.
  const even = S.every(([, b]) => b! % 2n === 0n);
  const scale = even ? 4n : 1n, D = even ? "\\Delta'" : "\\Delta";
  const [Bs, Cs] = [q(B1, scale), q(C0, scale)];
  const root = q(-C0, B1); // disc(m) = 0
  const rel = { distinct: ">", double: "=", none: "<", some: "\\ge" }[kind];
  const solved = kind === "double" ? `m=${tex(root)}` : `m${B1 > 0n ? { distinct: ">", none: "<", some: "\\ge" }[kind] : { distinct: "<", none: ">", some: "\\le" }[kind]}${tex(root)}`;
  const want = { distinct: "có hai nghiệm phân biệt", double: "có nghiệm kép", none: "vô nghiệm", some: "có nghiệm" }[kind];
  const discLatex = `${tex(Bs)}m${Cs.p === 0n ? "" : `${Cs.p < 0n ? "-" : "+"}${tex(q(Cs.p < 0n ? -Cs.p : Cs.p, Cs.q))}`}`.replace(/^1m/, "m").replace(/^-1m/, "-m");
  const details: AlgebraDeduction[] = [
    { title: "Hệ số và điều kiện của phương trình bậc hai", explanation: `Hệ số của $x^2$ là $${S[0]![2]}\\ne0$ với mọi $m$, nên đây là phương trình bậc hai. Phương trình ${want} khi và chỉ khi $${D}${rel}0$.`, math: null, reason: "Số nghiệm của phương trình bậc hai theo dấu của biệt thức", question: `Biệt thức cần thỏa điều kiện gì để phương trình ${want}?` },
    { title: even ? "Tính biệt thức thu gọn" : "Tính biệt thức", explanation: `${even ? "Hệ số của $x$ chẵn nên dùng biệt thức thu gọn $\\Delta'=b'^2-ac$ với $b=2b'$." : "Dùng $\\Delta=b^2-4ac$."} Khai triển và rút gọn:`, math: `${D}=${discLatex}`, reason: even ? "Công thức biệt thức thu gọn" : "Công thức biệt thức", question: "Sau khi khai triển, biệt thức là biểu thức nào của $m$?" },
    { title: "Giải điều kiện", explanation: `Giải ${kind === "double" ? "phương trình" : "bất phương trình"} bậc nhất ẩn $m$${B1 < 0n && kind !== "double" ? " (chia cho số âm thì đổi chiều)" : ""}.`, math: `${discLatex}${rel}0\\ \\Leftrightarrow\\ ${solved}`, reason: "Giải bất phương trình bậc nhất", question: "Chia hai vế cho hệ số của m, chiều bất đẳng thức có đổi không?" },
  ];
  const final = `Vậy phương trình ${want} khi và chỉ khi $${solved}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Phương trình bậc hai chứa tham số", "Xét dấu biệt thức theo tham số.", details, final, { givens: [`$${latexEq(e)}=0$`], unknowns: ["Các giá trị của $m$"] });
  const verify = () => {
    // Exact discriminant for every integer m in a window, compared with the claimed condition (m vs the boundary root).
    if (B1 * root.p + C0 * root.q !== 0n) return false;
    for (let mv = -30n; mv <= 30n; mv++) {
      const co = integerPolynomial(e.replace(/m/g, `(${mv})`), "x")?.coefficients;
      if (!co || co.length !== 3) return false;
      const d = co[1]! * co[1]! - 4n * co[2]! * co[0]!;
      const cmp = mv * root.q - root.p; // sign of m − root
      const holds = kind === "distinct" ? d > 0n : kind === "double" ? d === 0n : kind === "none" ? d < 0n : d >= 0n;
      const above = B1 > 0n;
      const claimed = kind === "double" ? cmp === 0n : kind === "distinct" ? (above ? cmp > 0n : cmp < 0n) : kind === "none" ? (above ? cmp < 0n : cmp > 0n) : (above ? cmp >= 0n : cmp <= 0n);
      if (holds !== claimed) return false;
    }
    return true;
  };
  return lesson ? { lesson, verify, label: "Tính lại biệt thức bằng số với m trên lưới và đối chiếu điều kiện tìm được", family: "discriminant-condition" } : null;
}
const latexEq = (e: string) => e.replace(/\*/g, "").replace(/\^(\d{2,})/g, "^{$1}");

// ------------------------------------------------------------------------------------------- x + 1/x = a family
/** "Cho x + 1/x = a. Tính x² + 1/x²" (also x³ + 1/x³): identities from the sum. */
export function reciprocalSumLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const given = /x\+\(?1\)?\/\(?x\)?=(-?\d+)/.exec(t);
  const ask = /tính\s+(?:giá trị (?:của )?)?(?:(?:biểu thức )?[A-Z]=)?x\^(\d)\+\(?1\)?\/\(?x\^(\d)\)?/i.exec(t);
  if (!given || !ask || ask[1] !== ask[2] || !["2", "3", "4"].includes(ask[1]!)) return null;
  const a = BigInt(given[1]!), n = Number(ask[1]);
  if (a * a < 4n) return null; // no real x: the premise is false; let the model/teacher flag it
  const s2 = a * a - 2n, s3 = a * a * a - 3n * a, s4 = s2 * s2 - 2n;
  const details: AlgebraDeduction[] = [
    { title: "Bình phương hai vế", explanation: `Bình phương tổng: $\\left(x+\\frac1x\\right)^2=x^2+2\\cdot x\\cdot\\frac1x+\\frac1{x^2}=x^2+\\frac1{x^2}+2$ (vì $x\\cdot\\frac1x=1$ khi $x\\ne0$).`, math: `x^2+\\frac{1}{x^2}=\\left(x+\\frac1x\\right)^2-2=${a}^2-2=${s2}`, reason: "Hằng đẳng thức $(u+v)^2=u^2+2uv+v^2$", question: "Bình phương $x+\\frac1x$ xuất hiện thêm hạng tử nào?" },
  ];
  if (n === 3) details.push({ title: "Lập phương của tổng", explanation: `Dùng $(u+v)^3=u^3+v^3+3uv(u+v)$ với $u=x$, $v=\\frac1x$, $uv=1$.`, math: `x^3+\\frac1{x^3}=\\left(x+\\frac1x\\right)^3-3\\left(x+\\frac1x\\right)=${a}^3-3\\cdot ${a}=${s3}`, reason: "Hằng đẳng thức lập phương của tổng", question: "Tích $x\\cdot\\frac1x$ bằng bao nhiêu?" });
  if (n === 4) details.push({ title: "Bình phương lần nữa", explanation: `Áp dụng cùng cách với $x^2+\\frac1{x^2}$.`, math: `x^4+\\frac1{x^4}=\\left(x^2+\\frac1{x^2}\\right)^2-2=${s2}^2-2=${s4}`, reason: "Hằng đẳng thức bình phương", question: "Bình phương $x^2+\\frac1{x^2}$ được gì?" });
  const ans = n === 2 ? s2 : n === 3 ? s3 : s4;
  const final = `Vậy $x^${n}+\\frac{1}{x^${n}}=${ans}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Hằng đẳng thức với tổng nghịch đảo", "Bình phương (hoặc lập phương) tổng đã biết để tạo biểu thức cần tính.", details, final, { givens: [`$x+\\frac1x=${a}$`], unknowns: [`$x^${n}+\\frac1{x^${n}}$`] });
  const verify = () => {
    const A = Number(a), x = (A + Math.sqrt(A * A - 4)) / 2;
    return Math.abs(x ** n + x ** -n - Number(ans)) < 1e-6 * Math.max(1, Math.abs(Number(ans)));
  };
  return lesson ? { lesson, verify, label: "Tính lại bằng nghiệm thực cụ thể của x + 1/x = a", family: "reciprocal-sum" } : null;
}

export const ALGEBRA_ROUTINES = [quadraticExtremumLesson, discriminantConditionLesson, reciprocalSumLesson];
void isqrt;
