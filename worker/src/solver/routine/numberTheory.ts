import { algebraProofLesson, type AlgebraDeduction } from "../algebraProofLesson";
import { integerPolynomial, integerPolynomialValue } from "../../../../shared/src/integerPolynomial";
import { integerResidueLesson } from "../integerResidueLesson";
import { verifyResidueCertificate } from "../../../../shared/src/integerPolynomial";
import type { ModelLesson } from "../../../../shared/src/solution";
import {
  abs, bivariate, bivariateValue, coef, domainOf, domainWord, flatten, gcd, inDomain, integerValue, isqrt, latex, mod,
  positiveDivisors, type Domain,
} from "./text";

export interface RoutineResult {
  lesson: ModelLesson;
  /** Independent re-check of the mathematical certificate behind the lesson (not of its prose). */
  verify: () => boolean;
  label: string;
  family: string;
}

const lessonOf = (text: string, subtopic: string, strategy: string, details: AlgebraDeduction[], final: string, meta: { givens: string[]; unknowns: string[]; constraints?: string[] }) =>
  algebraProofLesson(text, subtopic, strategy, details, final, { topic: "number_theory", ...meta });

/** Only one question: a lettered part or a second request would be silently dropped. */
const singleTask = (t: string) => !/(?:^|\s)[a-e]\)|\bcâu\s+[a-e]\b|;\s*(?:tính|tìm|chứng minh)/i.test(t);

// ------------------------------------------------------------------------------------------------ remainder of a^n
/** "Tìm số dư khi chia a^n cho m", "chữ số tận cùng của a^n", "hai chữ số tận cùng của a^n". */
export function powerResidueLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const powers = [...t.matchAll(/(?<![\w^)])(\d+)\^(\d+)(?![\d^(])/g)];
  if (powers.length !== 1) return null;
  const a = BigInt(powers[0]![1]!), n = BigInt(powers[0]![2]!);
  let m: bigint | null = null, what: "remainder" | "last" | "last2" = "remainder";
  if (/hai chữ số tận cùng|2 chữ số tận cùng/i.test(t)) { m = 100n; what = "last2"; }
  else if (/chữ số tận cùng/i.test(t)) { m = 10n; what = "last"; }
  else if (/số dư|dư bao nhiêu|remainder/i.test(t)) {
    const after = t.slice(powers[0]!.index! + powers[0]![0].length);
    const mm = /^\)?\s*(?:khi\s+)?(?:chia|cho)\s+(?:cho\s+)?(\d+)\b|^[^\d]{0,25}?\bcho\s+(\d+)\b/i.exec(after) ?? /chia\s+cho\s+(\d+)[^\d]*$/i.exec(t);
    const before = /chia\s+(?:cho\s+)?(\d+)\s*$/.exec(t.slice(0, powers[0]!.index!)); // "số dư của phép chia cho 7 của 2^2026" (rare)
    const v = mm?.[1] ?? mm?.[2] ?? before?.[1];
    if (v) m = BigInt(v);
  }
  if (!m || m < 2n || m > 1000n || n < 1n || n > 10n ** 12n || a < 2n) return null;
  // Every other number in the text must be the base, the exponent or the modulus.
  const numbers = [...t.matchAll(/\d+/g)].map((x) => x[0]);
  if (numbers.some((x) => ![String(a), String(n), String(m), "2"].includes(x)) || (numbers.includes("2") && ![a, n, m].includes(2n) && what !== "last2")) return null;
  // Powers a^1, a^2, … mod m until a value repeats: preperiod s, period p.
  const seen = new Map<bigint, number>();
  const values: bigint[] = [];
  let v = mod(a, m);
  for (let k = 1; !seen.has(v) && k <= 200; k++) {
    seen.set(v, k);
    values.push(v);
    v = mod(v * a, m);
  }
  if (!seen.has(v)) return null;
  const s = seen.get(v)!, p = values.length - s + 1; // a^(s+p) ≡ a^s
  if (p > 24) return null;
  const answer = n < BigInt(s) ? values[Number(n) - 1]! : values[s - 1 + Number(mod(n - BigInt(s), BigInt(p)))]!;
  const A = String(a), N = String(n), M = String(m);
  const one = values[p - 1] === 1n && s === 1; // the cycle returns to 1: a^p ≡ 1 (mod m)
  const shown = values.slice(0, s - 1 + p + (one ? 0 : 1)).map((r, i) => `${A}^{${i + 1}}\\equiv ${r}`);
  const details: AlgebraDeduction[] = [];
  const goal = what === "remainder" ? `số dư khi chia $${A}^{${N}}$ cho $${M}$` : what === "last" ? `chữ số tận cùng của $${A}^{${N}}$, tức là số dư khi chia $${A}^{${N}}$ cho $10$` : `hai chữ số tận cùng của $${A}^{${N}}$, tức là số dư khi chia $${A}^{${N}}$ cho $100$`;
  details.push({
    title: "Tính số dư của các lũy thừa nhỏ",
    explanation: `Cần tìm ${goal}. Số mũ quá lớn để tính trực tiếp, nên ta tìm quy luật. Mỗi lũy thừa sau bằng lũy thừa trước nhân $${A}$, nên số dư của lũy thừa sau bằng số dư của (số dư trước $\\times ${A}$) khi chia cho $${M}$. Ta tính lần lượt cho đến khi một số dư lặp lại.`,
    math: `${shown.join(",\\quad ")}\\pmod{${M}}`,
    reason: "Tính chất: nếu $a\\equiv b\\pmod m$ thì $ac\\equiv bc\\pmod m$",
    question: `Nhân số dư trước với $${A}$ rồi chia cho $${M}$, số dư nào xuất hiện lại đầu tiên?`,
  });
  let final: string;
  if (one) {
    const q = n / BigInt(p), r = n % BigInt(p);
    details.push({
      title: `Viết số mũ theo chu kì ${p}`,
      explanation: `Ta có $${A}^{${p}}\\equiv 1\\pmod{${M}}$. Chia số mũ $${N}$ cho $${p}$: $${N}=${p}\\cdot ${q}+${r}$. Do đó $${A}^{${N}}=(${A}^{${p}})^{${q}}\\cdot ${A}^{${r}}$. Vì $${A}^{${p}}\\equiv1$ nên $(${A}^{${p}})^{${q}}\\equiv 1^{${q}}=1\\pmod{${M}}$ (nâng hai vế đồng dư lên cùng lũy thừa).`,
      math: `${A}^{${N}}=\\left(${A}^{${p}}\\right)^{${q}}\\cdot ${A}^{${r}}\\equiv 1\\cdot ${A}^{${r}}\\equiv ${answer}\\pmod{${M}}`,
      reason: "Phép chia có dư cho số mũ; nâng đồng dư lên lũy thừa",
      question: `Số mũ $${N}$ chia cho $${p}$ dư bao nhiêu?`,
    });
  } else {
    const back = n < BigInt(s) ? null : BigInt(s) + mod(n - BigInt(s), BigInt(p));
    details.push({
      title: `Các số dư lặp lại với chu kì ${p}`,
      explanation: `Ta thấy $${A}^{${s + p}}\\equiv ${A}^{${s}}\\pmod{${M}}$. Nhân hai vế với $${A}^{k}$ được $${A}^{${s + p}+k}\\equiv ${A}^{${s}+k}$ với mọi $k\\ge 0$: từ lũy thừa $${s}$ trở đi, cứ tăng số mũ thêm $${p}$ thì số dư không đổi. Vì vậy chỉ cần biết số mũ $${N}$ thuộc vị trí nào trong chu kì.`,
      math: back ? `${N}=${back}+${p}\\cdot ${(n - back) / BigInt(p)}\\ \\Rightarrow\\ ${A}^{${N}}\\equiv ${A}^{${back}}\\equiv ${answer}\\pmod{${M}}` : null,
      reason: "Nhân hai vế đồng dư với cùng một số; phép chia có dư cho số mũ",
      question: `Bớt đi bội của ${p} từ số mũ ${N}, ta về được lũy thừa nào trong bảng?`,
    });
  }
  final = what === "remainder" ? `Vậy số dư khi chia $${A}^{${N}}$ cho $${M}$ là $${answer}$.` : what === "last" ? `Vậy chữ số tận cùng của $${A}^{${N}}$ là $${answer}$.` : `Vậy hai chữ số tận cùng của $${A}^{${N}}$ là $${String(answer).padStart(2, "0")}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Định nghĩa số dư", question: "Đáp số là bao nhiêu?" });
  const lesson = lessonOf(text, "Số dư của lũy thừa (chu kì số dư)", "Tính số dư của các lũy thừa nhỏ để tìm chu kì, rồi chia số mũ cho chu kì.", details, final, {
    givens: [`$${A}^{${N}}$`, `chia cho $${M}$`], unknowns: [what === "remainder" ? "Số dư" : "Chữ số tận cùng"],
  });
  return lesson ? { lesson, verify: () => powMod(a, n, m) === answer, label: "Tính lại số dư bằng lũy thừa nhanh theo môđun (độc lập với chu kì)", family: "power-residue" } : null;
}

function powMod(a: bigint, e: bigint, m: bigint): bigint {
  let r = 1n % m, b = mod(a, m);
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}

// ---------------------------------------------------------------------------------------------- gcd / lcm (numbers)
/** ƯCLN / BCNN / gcd(...) of two given numbers (or closed numeric expressions such as 2^12-1), by Euclid. */
export function gcdLcmLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const wantG = /ước chung lớn nhất|\bgcd\b|greatest common divisor/i.test(t), wantL = /bội chung nhỏ nhất|\blcm\b|least common multiple/i.test(t);
  if (!wantG && !wantL) return null;
  let args: string[] | null = null;
  const call = /(?:gcd|lcm)\(([^()]*(?:\([^()]*\)[^()]*)*),([^()]*(?:\([^()]*\)[^()]*)*)\)/.exec(t);
  if (call) args = [call[1]!, call[2]!];
  else {
    const m = /(?:của|of)\s+([\d^+\-*()]+)\s+(?:và|and)\s+([\d^+\-*()]+)/i.exec(t);
    if (m) args = [m[1]!, m[2]!];
  }
  if (!args) return null;
  const [a, b] = args.map(integerValue);
  if (a == null || b == null || a <= 0n || b <= 0n || a > 10n ** 15n || b > 10n ** 15n) return null;
  // Euclid on (larger, smaller).
  let [u, v] = a >= b ? [a, b] : [b, a];
  const rows: string[] = [];
  while (v !== 0n) {
    rows.push(`${u}=${v}\\cdot ${u / v}+${u % v}`);
    [u, v] = [v, u % v];
    if (rows.length > 40) return null;
  }
  const g = u, l = (a / g) * b;
  const [A, B] = args.map((s) => latex(s));
  const shownA = String(a) === args[0]!.replace(/\s/g, "") ? A! : `${A}=${a}`, shownB = String(b) === args[1]!.replace(/\s/g, "") ? B! : `${B}=${b}`;
  const details: AlgebraDeduction[] = [];
  details.push({
    title: "Tính hai số",
    explanation: `Hai số cần xét là $${shownA}$ và $${shownB}$.`,
    math: null, reason: "Tính giá trị biểu thức", question: "Hai số cần tìm ước chung là bao nhiêu?",
  });
  details.push({
    title: "Thực hiện thuật toán Euclid",
    explanation: `Chia số lớn cho số nhỏ, rồi lấy số chia chia cho số dư, lặp lại đến khi số dư bằng $0$. Mỗi bước dùng tính chất: nếu $u=vq+r$ thì $\\gcd(u,v)=\\gcd(v,r)$, vì mọi ước chung của $u$ và $v$ đều chia hết $r=u-vq$, và ngược lại mọi ước chung của $v$ và $r$ đều chia hết $u=vq+r$.`,
    math: `\\begin{aligned}${rows.join("\\\\")}\\end{aligned}`,
    reason: "Thuật toán Euclid: $\\gcd(u,v)=\\gcd(v,r)$",
    question: "Số dư khác 0 cuối cùng là bao nhiêu?",
  });
  details.push({
    title: "Số dư khác 0 cuối cùng là ƯCLN",
    explanation: `Phép chia cuối có số dư $0$, nên $\\gcd$ bằng số chia cuối cùng (số dư khác $0$ cuối cùng): $\\gcd(${a},${b})=${g}$.`,
    math: `\\gcd(${a},${b})=${g}`, reason: "$\\gcd(d,0)=d$", question: "Vì sao số chia cuối cùng là ƯCLN?",
  });
  if (wantL)
    details.push({
      title: "Tính BCNN từ ƯCLN",
      explanation: `Với hai số nguyên dương $a,b$ ta có $\\gcd(a,b)\\cdot\\operatorname{lcm}(a,b)=a\\cdot b$. Do đó BCNN bằng tích hai số chia cho ƯCLN.`,
      math: `\\operatorname{BCNN}(${a},${b})=\\frac{${a}\\cdot ${b}}{${g}}=${l}`,
      reason: "Hệ thức $\\gcd(a,b)\\cdot\\operatorname{lcm}(a,b)=ab$",
      question: "Tích hai số chia cho ƯCLN được bao nhiêu?",
    });
  const final = wantG && wantL ? `Vậy ƯCLN là $${g}$ và BCNN là $${l}$.` : wantG ? `Vậy ước chung lớn nhất là $${g}$.` : `Vậy bội chung nhỏ nhất là $${l}$.`;
  const lesson = lessonOf(text, "Ước chung lớn nhất, bội chung nhỏ nhất", "Dùng thuật toán Euclid để tìm ƯCLN" + (wantL ? ", rồi suy ra BCNN." : "."), details, final, {
    givens: [`$${shownA}$`, `$${shownB}$`], unknowns: [wantG && wantL ? "ƯCLN và BCNN" : wantG ? "ƯCLN" : "BCNN"],
  });
  // Certificate: g divides both and some integer combination equals g (so every common divisor divides g).
  const verify = () => {
    const [x, y] = bezout(a, b);
    return a % g === 0n && b % g === 0n && a * x + b * y === g && l % a === 0n && l % b === 0n && l * g === a * b;
  };
  return lesson ? { lesson, verify, label: "Kiểm tra ƯCLN bằng đẳng thức Bézout độc lập (ước chung nào cũng chia hết ƯCLN) và BCNN·ƯCLN = tích", family: "gcd-lcm" } : null;
}

function bezout(a: bigint, b: bigint): [bigint, bigint] {
  let [r0, r1, s0, s1, t0, t1] = [a, b, 1n, 0n, 0n, 1n];
  while (r1) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return [s0, t0];
}

// ------------------------------------------------------------------------------- A(n) divisible by a linear B(n)
/** "Tìm (các) số nguyên n sao cho A(n) chia hết cho B(n)" with B linear in n (any word order). */
export function linearDivisorLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/tìm|find/i.test(t)) return null;
  const domain = domainOf(t);
  const m = /([0-9a-z^+\-*()]+)\s+chia hết cho\s+([0-9a-z^+\-*()]+)/i.exec(t) ?? /([0-9a-z^+\-*()]+)\s+(?:là bội của)\s+([0-9a-z^+\-*()]+)/i.exec(t);
  if (!domain || !m) return null;
  const [numE, denE] = [m[1]!, m[2]!.replace(/[.,]$/, "")];
  const variable = [...new Set([...(numE + denE).matchAll(/[a-z]/g)].map((x) => x[0]))];
  if (variable.length !== 1) return null;
  const v = variable[0]!;
  const A = integerPolynomial(numE, v), B = integerPolynomial(denE, v);
  if (!A || !B || B.coefficients.length !== 2 || A.coefficients.length < 2) return null;
  // No other conditions in the text (inequalities, a second unknown, extra parts).
  if (/[<>≤≥≠]|và\s+[a-z]\b/.test(t)) return null;
  const [d, c] = B.coefficients as [bigint, bigint];
  const deg = A.coefficients.length - 1;
  // c^deg·A(n) − K is a multiple of (c n + d): K = c^deg·A(−d/c) = Σ a_j c^(deg−j) (−d)^j.
  let K = 0n;
  A.coefficients.forEach((a, j) => (K += a * c ** BigInt(deg - j) * (-d) ** BigInt(j)));
  if (K === 0n || abs(K) > 10n ** 7n) return null;
  const quotient = divideByLinear(A.coefficients.map((a) => a * c ** BigInt(deg)), c, d, K);
  if (!quotient) return null;
  const candidates: bigint[] = [];
  for (const q of positiveDivisors(K))
    for (const delta of [q, -q]) if ((delta - d) % c === 0n) candidates.push((delta - d) / c);
  candidates.sort((x, y) => (x < y ? -1 : 1));
  const check = (n: bigint) => {
    const b = integerPolynomialValue(B, n);
    return b !== 0n && integerPolynomialValue(A, n) % b === 0n;
  };
  const valid = candidates.filter((n) => inDomain(domain, n) && check(n));
  const rejected = candidates.filter((n) => !valid.includes(n));
  const P = latex(numE), Q = latex(denE), cpow = c === 1n || deg === 0 ? "" : c === -1n ? "" : `${abs(c) === 1n ? "" : c}${deg > 1 && abs(c) !== 1n ? `^{${deg}}` : ""}`;
  const multiplied = cpow ? `${cpow}(${P})` : P;
  const qLatex = polyLatex(quotient, v);
  const times = qLatex === "1" ? `(${Q})` : qLatex === "-1" ? `-(${Q})` : `(${Q})(${qLatex})`;
  const details: AlgebraDeduction[] = [];
  details.push({
    title: "Tách phần chia hết",
    explanation: `Ta viết ${cpow ? `$${multiplied}$ (nhân thêm hệ số để phép chia không có phân số)` : `$${P}$`} thành một bội của $${Q}$ cộng với một số nguyên. Kiểm tra lại bằng cách khai triển vế phải.`,
    math: `${multiplied}=${times}${K < 0n ? "" : "+"}${K}`,
    reason: "Phép chia đa thức cho đa thức bậc nhất",
    question: `Sau khi bớt đi bội của $${Q}$, còn lại số nào?`,
  });
  details.push({
    title: `Suy ra $${Q}$ là ước của $${K}$`,
    explanation: cpow
      ? `Nếu $${P}$ chia hết cho $${Q}$ thì $${multiplied}$ cũng chia hết cho $${Q}$; trừ đi $${times}$ (là bội của $${Q}$) ta được $${Q}$ là ước của $${K}$. Đây mới là điều kiện cần. Ước của một số khác $0$ luôn khác $0$, nên mẫu $${Q}\\ne0$.`
      : `Vì $${times}$ là bội của $${Q}$, nên $${P}$ chia hết cho $${Q}$ khi và chỉ khi $${K}$ chia hết cho $${Q}$, tức $${Q}$ là ước của $${K}$. Ước của một số khác $0$ luôn khác $0$, nên mẫu $${Q}\\ne0$.`,
    math: `${Q}\\in\\{${positiveDivisors(K).flatMap((x) => [`\\pm${x}`]).join(";")}\\}`,
    reason: "Tính chất chia hết của hiệu",
    question: `$${K}$ có những ước nguyên nào?`,
  });
  details.push({
    title: "Tìm các giá trị và thử lại",
    explanation: `Giải $${Q}$ bằng từng ước, chỉ giữ giá trị ${domainWord(domain)} của $${v}$, rồi thay lại vào đề để kiểm tra (bắt buộc${cpow ? ", vì ở trên ta đã nhân thêm hệ số nên điều kiện chỉ là điều kiện cần" : ""}). ${rejected.length ? `Loại $${v}\\in\\{${rejected.join(";")}\\}$ (không phải số ${domainWord(domain)}${cpow ? " hoặc không thỏa khi thử lại" : ""}).` : ""}`,
    math: candidates.length ? `\\begin{array}{c|${"c".repeat(candidates.length)}}${v}&${candidates.join("&")}\\\\\\hline \\text{thỏa?}&${candidates.map((n) => (valid.includes(n) ? "\\checkmark" : "\\times")).join("&")}\\end{array}` : null,
    reason: "Thử lại trong đề gốc; điều kiện của ẩn",
    question: "Giá trị nào thỏa cả miền của ẩn và điều kiện chia hết?",
  });
  const final = valid.length ? `Vậy $${v}\\in\\{${valid.join(";")}\\}$.` : `Vậy không có số ${domainWord(domain)} $${v}$ nào thỏa mãn.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Có bao nhiêu giá trị thỏa mãn?" });
  const lesson = lessonOf(text, "Tìm số nguyên để biểu thức chia hết", "Tách phần chia hết để đưa về bài toán tìm ước của một số.", details, final, {
    givens: [`$${P}\\ \\vdots\\ ${Q}$`, `$${v}$ là số ${domainWord(domain)}`], unknowns: [`Tất cả giá trị của $${v}$`],
  });
  // Certificate: identity holds; |B(n)| ≤ |K| for every solution, so an exhaustive search over that window is complete.
  const verify = () => {
    const lhs = A.coefficients.map((a) => a * c ** BigInt(deg));
    const prod = multiplyLinear(quotient, c, d);
    prod[0] = (prod[0] ?? 0n) + K;
    if (lhs.some((x, i) => x !== (prod[i] ?? 0n)) || prod.length > lhs.length && prod.slice(lhs.length).some((x) => x !== 0n)) return false;
    const R = (abs(K) + abs(d)) / (abs(c) || 1n) + 2n;
    const brute: bigint[] = [];
    for (let n = -R; n <= R; n++) if (inDomain(domain, n) && check(n)) brute.push(n);
    return brute.length === valid.length && brute.every((x, i) => x === valid[i]);
  };
  return lesson ? { lesson, verify, label: "Kiểm tra đẳng thức chia đa thức và tìm kiếm vét cạn trên toàn miền có thể (|B(n)| ≤ |K|)", family: "linear-divisor" } : null;
}

function divideByLinear(p: bigint[], c: bigint, d: bigint, K: bigint): bigint[] | null {
  // p(n) = (c n + d) q(n) + K, from the top coefficient down.
  const q = Array<bigint>(Math.max(p.length - 1, 1)).fill(0n);
  let rem = [...p];
  for (let i = p.length - 1; i >= 1; i--) {
    if (rem[i]! % c !== 0n) return null;
    const k = rem[i]! / c;
    q[i - 1] = k;
    rem[i] = 0n;
    rem[i - 1] = rem[i - 1]! - k * d;
  }
  return rem[0] === K ? q : null;
}
function multiplyLinear(q: bigint[], c: bigint, d: bigint): bigint[] {
  const out = Array<bigint>(q.length + 1).fill(0n);
  q.forEach((k, i) => {
    out[i] = out[i]! + k * d;
    out[i + 1] = out[i + 1]! + k * c;
  });
  return out;
}
function polyLatex(p: bigint[], v: string): string {
  const terms: string[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const k = p[i]!;
    if (k === 0n) continue;
    const body = i === 0 ? String(abs(k)) : `${abs(k) === 1n ? "" : abs(k)}${v}${i > 1 ? `^{${i}}` : ""}`;
    terms.push(`${k < 0n ? "-" : terms.length ? "+" : ""}${body}`);
  }
  return terms.join("") || "0";
}

// ------------------------------------------------------------------------------------- integer equations in x, y
/** x²−y²=N, x²+y²=N, xy+ax+by=c (in any arrangement), with integer / natural / positive unknowns. */
export function integerEquationLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/cặp|nghiệm nguyên|pairs?/i.test(t)) return null;
  const domain = domainOf(t) ?? (/nghiệm nguyên/i.test(t) ? "integer" : null);
  const eqs = [...t.matchAll(/([0-9xy^+\-*()]+)=([0-9xy^+\-*()]+)/g)];
  if (!domain || eqs.length !== 1 || /[<>≤≥≠]/.test(t)) return null;
  const left = bivariate(eqs[0]![1]!, "x", "y"), right = bivariate(eqs[0]![2]!, "x", "y");
  if (!left || !right) return null;
  const p = new Map(left);
  for (const [k, v] of right) p.set(k, (p.get(k) ?? 0n) - v);
  for (const [k, v] of p) if (v === 0n) p.delete(k);
  const keys = [...p.keys()].filter((k) => k !== "0,0").sort().join(" ");
  const c0 = -coef(p, 0, 0);
  const eq = latex(`${eqs[0]![1]}=${eqs[0]![2]}`);
  const sols: [bigint, bigint][] = [];
  const details: AlgebraDeduction[] = [];
  let family: string, bound: bigint;
  const D = domainWord(domain);
  if (keys === "0,2 2,0" && coef(p, 2, 0) === 1n && coef(p, 0, 2) === -1n && c0 !== 0n && abs(c0) <= 10n ** 6n) {
    family = "difference-of-squares";
    const N = c0;
    bound = abs(N);
    const pairs: [bigint, bigint][] = [];
    for (const u of positiveDivisors(N)) for (const s of [1n, -1n]) pairs.push([s * u, N / (s * u)]);
    const rows: string[] = [];
    for (const [u, w] of pairs) {
      // x − y = u, x + y = w
      if ((u + w) % 2n !== 0n) { rows.push(`${u}&${w}&\\text{khác tính chẵn lẻ}`); continue; }
      const x = (u + w) / 2n, y = (w - u) / 2n;
      const ok = inDomain(domain, x) && inDomain(domain, y);
      rows.push(`${u}&${w}&(${x};${y})${ok ? "" : "\\ \\text{(loại)}"}`);
      if (ok) sols.push([x, y]);
    }
    details.push({ title: "Phân tích thành tích", explanation: `Dùng hằng đẳng thức hiệu hai bình phương: $x^2-y^2=(x-y)(x+y)$. Phương trình trở thành tích của hai số nguyên bằng $${N}$.`, math: `(x-y)(x+y)=${N}`, reason: "Hằng đẳng thức $a^2-b^2=(a-b)(a+b)$", question: "Viết vế trái thành tích như thế nào?" });
    details.push({ title: "Xét các cặp ước", explanation: `$x-y$ và $x+y$ là hai số nguyên có tích bằng $${N}$, nên là một cặp ước của $${N}$. Ngoài ra $(x+y)+(x-y)=2x$ là số chẵn, nên hai thừa số phải cùng tính chẵn lẻ. Với mỗi cặp, giải hệ $x-y=u$, $x+y=w$ được $x=\\frac{u+w}{2}$, $y=\\frac{w-u}{2}$; chỉ giữ nghiệm là số ${D}.`, math: `\\begin{array}{c|c|c}x-y&x+y&(x;y)\\\\\\hline ${rows.join("\\\\")}\\end{array}`, reason: "Ước của một số nguyên; tính chẵn lẻ của tổng và hiệu", question: "Những cặp ước nào cùng tính chẵn lẻ?" });
  } else if (keys === "0,2 2,0" && coef(p, 2, 0) === 1n && coef(p, 0, 2) === 1n && c0 >= 0n && c0 <= 2000n) {
    family = "sum-of-two-squares";
    const N = c0, r = isqrt(N);
    bound = r;
    const rows: string[] = [];
    for (let x = 0n; x <= r; x++) {
      const rest = N - x * x, s = isqrt(rest), sq = s * s === rest;
      rows.push(`${x}&${rest}&${sq ? `y=\\pm${s}` : "\\text{không chính phương}"}`);
      if (sq) for (const sx of x ? [x, -x] : [0n]) for (const sy of s ? [s, -s] : [0n]) if (inDomain(domain, sx) && inDomain(domain, sy)) sols.push([sx, sy]);
    }
    details.push({ title: "Chặn giá trị của ẩn", explanation: `Vì $y^2\\ge0$ nên $x^2\\le ${N}$, tức $|x|\\le ${r}$ (vì $${r}^2=${r * r}\\le ${N}<${(r + 1n) ** 2n}=${r + 1n}^2$). Do đó chỉ có hữu hạn trường hợp, và vì phương trình chỉ chứa $x^2$, ta xét $|x|=0,1,\\ldots,${r}$.`, math: `0\\le x^2\\le ${N}\\ \\Rightarrow\\ |x|\\le ${r}`, reason: "Bình phương không âm", question: "$|x|$ lớn nhất có thể là bao nhiêu?" });
    details.push({ title: "Xét từng trường hợp", explanation: `Với mỗi giá trị $|x|$, tính $y^2=${N}-x^2$ và kiểm tra có phải số chính phương không. Mỗi giá trị $|x|>0$ cho hai giá trị $x$ đối nhau; tương tự với $y$.`, math: `\\begin{array}{c|c|c}|x|&y^2=${N}-x^2&y\\\\\\hline ${rows.join("\\\\")}\\end{array}`, reason: "Xét hết các trường hợp hữu hạn", question: "Những giá trị nào của $y^2$ là số chính phương?" });
  } else if (keys === "0,1 1,0 1,1" || keys === "1,1" || keys === "0,1 1,1" || keys === "1,0 1,1") {
    const a = coef(p, 1, 1);
    if (abs(a) !== 1n) return null;
    // a·xy + b·x + c·y = c0  →  (x + c/a)(y + b/a) = c0/a + bc/a²
    const b = coef(p, 1, 0) * a, c = coef(p, 0, 1) * a, K = c0 * a + b * c;
    if (K === 0n || abs(K) > 10n ** 6n) return null;
    family = "factorable-xy";
    bound = abs(K) + abs(b) + abs(c);
    const X = c === 0n ? "x" : `x${c > 0n ? "+" : ""}${c}`, Y = b === 0n ? "y" : `y${b > 0n ? "+" : ""}${b}`;
    const rows: string[] = [];
    for (const q of positiveDivisors(K))
      for (const u of [q, -q]) {
        const x = u - c, y = K / u - b;
        const ok = inDomain(domain, x) && inDomain(domain, y);
        rows.push(`${u}&${K / u}&(${x};${y})${ok ? "" : "\\ \\text{(loại)}"}`);
        if (ok) sols.push([x, y]);
      }
    details.push({ title: "Đưa về dạng tích", explanation: `Nhóm các hạng tử và thêm bớt hằng số để vế trái thành tích: ${a < 0n ? "đổi dấu hai vế, rồi " : ""}cộng $${b * c}$ vào hai vế. Khai triển vế trái để kiểm tra lại.`, math: `(${X})(${Y})=${K}`, reason: "Nhóm hạng tử, đặt nhân tử chung", question: "Cần cộng thêm số nào để vế trái phân tích được thành tích?" });
    details.push({ title: "Xét các cặp ước", explanation: `$${X}$ và $${Y}$ là hai số nguyên có tích bằng $${K}$, nên $${X}$ là một ước của $${K}$. Xét mọi ước (cả âm), tính $x,y$ và giữ nghiệm là số ${D}.`, math: `\\begin{array}{c|c|c}${X}&${Y}&(x;y)\\\\\\hline ${rows.join("\\\\")}\\end{array}`, reason: "Ước của một số nguyên", question: `$${K}$ có những ước nguyên nào?` });
  } else return null;
  sols.sort((u, v) => (u[0] === v[0] ? (u[1] < v[1] ? -1 : 1) : u[0] < v[0] ? -1 : 1));
  const list = sols.map(([x, y]) => `(${x};${y})`).join(";\\ ");
  const final = sols.length ? `Vậy các cặp số ${D} $(x;y)$ thỏa mãn là: $${list}$.` : `Vậy không có cặp số ${D} nào thỏa mãn.`;
  details.push({ title: "Kết luận", explanation: `Các trường hợp trên là tất cả các khả năng, nên không bỏ sót nghiệm. ${final}`, math: null, reason: "Đã xét hết các trường hợp", question: "Có bao nhiêu cặp nghiệm?" });
  const lesson = lessonOf(text, "Phương trình nghiệm nguyên", family === "sum-of-two-squares" ? "Chặn giá trị của ẩn rồi xét hết các trường hợp." : "Đưa phương trình về dạng tích hai số nguyên bằng một hằng số, rồi xét các cặp ước.", details, final, {
    givens: [`$${eq}$`, `$x,y$ là số ${D}`], unknowns: ["Tất cả các cặp $(x;y)$"],
  });
  const verify = () => {
    const R = bound + 2n;
    const brute: string[] = [];
    for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) if (inDomain(domain, x) && inDomain(domain, y) && bivariateValue(p, x, y) === 0n) brute.push(`${x},${y}`);
    return brute.length === sols.length && sols.every(([x, y]) => brute.includes(`${x},${y}`));
  };
  if (bound > 3000n) return null;
  return lesson ? { lesson, verify, label: "Tìm kiếm vét cạn độc lập trên miền đã chứng minh là chứa mọi nghiệm", family } : null;
}

// ---------------------------------------------------------------------------------- smallest number with remainders
/** "Tìm số tự nhiên nhỏ nhất chia cho a dư r, chia cho b dư s, …". */
export function remaindersLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/nhỏ nhất|smallest/i.test(t)) return null;
  const conds = [...t.matchAll(/chia (?:cho )?(\d+) (?:thì )?dư (\d+)/gi)].map((m) => [BigInt(m[1]!), BigInt(m[2]!)] as [bigint, bigint]);
  const all = [...t.matchAll(/chia hết cho (\d+)/gi)].map((m) => [BigInt(m[1]!), 0n] as [bigint, bigint]);
  const cs = [...conds, ...all];
  if (cs.length < 2 || cs.some(([a, r]) => a < 2n || r >= a || a > 1000n)) return null;
  const domain: Domain = /nguyên dương|positive/i.test(t) ? "positive" : "natural";
  const details: AlgebraDeduction[] = [];
  let [M, x] = [cs[0]![0], cs[0]![1]];
  if (domain === "positive" && x === 0n) x = M;
  details.push({ title: "Viết dạng của số cần tìm theo điều kiện đầu", explanation: `Số chia cho $${M}$ dư $${cs[0]![1]}$ có dạng $${M}k+${cs[0]![1]}$ ($k$ tự nhiên), tức là một trong các số $${[0, 1, 2, 3].map((k) => M * BigInt(k) + cs[0]![1]).join(", ")},\\ldots$`, math: null, reason: "Định nghĩa phép chia có dư", question: "Các số chia cho số đầu tiên có số dư đã cho có dạng nào?" });
  for (const [a, r] of cs.slice(1)) {
    const tried: bigint[] = [];
    let y = x;
    while (mod(y, a) !== r) {
      tried.push(y);
      y += M;
      if (tried.length > 1000) return null;
    }
    const L = (M / gcd(M, a)) * a;
    details.push({
      title: `Thêm điều kiện chia cho ${a} dư ${r}`,
      explanation: `Thử lần lượt các số dạng $${x}+${M}k$: ${[...tried.slice(0, 6), y].map((v) => `$${v}$ chia $${a}$ dư $${mod(v, a)}$`).join(", ")}${tried.length > 6 ? ", …" : ""}. Số nhỏ nhất thỏa là $${y}$. Hai số cùng thỏa các điều kiện đã xét thì hiệu của chúng chia hết cho cả $${M}$ và $${a}$, tức chia hết cho $\\operatorname{BCNN}(${M},${a})=${L}$; vậy các số thỏa đến lúc này có dạng $${y}+${L}k$.`,
      math: `x\\equiv ${y}\\pmod{${L}}`,
      reason: "Hiệu hai số có cùng số dư thì chia hết cho số chia; BCNN",
      question: `Trong dãy $${x}, ${x + M}, \\ldots$ số đầu tiên chia $${a}$ dư $${r}$ là số nào?`,
    });
    [M, x] = [L, y];
  }
  const final = `Vậy số ${domain === "positive" ? "nguyên dương" : "tự nhiên"} nhỏ nhất thỏa mãn là $${x}$.`;
  details.push({ title: "Kết luận", explanation: `Mọi số thỏa mãn đều có dạng $${x}+${M}k$ với $k\\ge0$, nên số nhỏ nhất là $${x}$. ${final}`, math: null, reason: "Số nhỏ nhất của dãy", question: "Số nhỏ nhất là bao nhiêu?" });
  const lesson = lessonOf(text, "Bài toán chia có dư (tìm số nhỏ nhất)", "Lần lượt ghép từng điều kiện: liệt kê các số thỏa điều kiện trước, chọn số đầu tiên thỏa điều kiện sau.", details, final, {
    givens: cs.map(([a, r]) => `chia cho $${a}$ dư $${r}$`), unknowns: ["Số nhỏ nhất thỏa mãn"],
  });
  const verify = () => {
    for (let v = domain === "positive" ? 1n : 0n; v <= x; v++) if (cs.every(([a, r]) => mod(v, a) === r)) return v === x;
    return false;
  };
  return lesson ? { lesson, verify, label: "Tìm kiếm tuần tự độc lập: không có số nhỏ hơn thỏa mọi điều kiện", family: "remainders" } : null;
}

// ----------------------------------------------------------------------------- "P(n) chia hết cho m với mọi n"
/** Reworded "for every integer n, P(n) is divisible by m" → the existing certified residue-class lesson. */
export function divisibleForAllLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/chứng minh|chứng tỏ|prove|show/i.test(t)) return null;
  const domain = domainOf(t);
  const m = /([0-9a-z^+\-*()]+)\s+(?:luôn\s+)?chia hết cho\s+(\d+)/i.exec(t);
  const all = /với mọi (?:số )?(?:nguyên|tự nhiên|nguyên dương)?\s*(?:số )?(?:nguyên dương|nguyên|tự nhiên)?\s*([a-z])\b|mọi\s+([a-z])\s*∈/i.exec(t);
  if (!domain || !m || !all) return null;
  const v = (all[1] ?? all[2])!;
  const expr = m[1]!;
  if ([...new Set(expr.match(/[a-z]/g) ?? [])].join("") !== v) return null;
  const canonical = `Chứng minh rằng với mọi số ${domain === "integer" ? "nguyên" : domain === "natural" ? "tự nhiên" : "nguyên dương"} $${v}$, $${expr}$ chia hết cho $${m[2]}$.`;
  const r = integerResidueLesson(canonical);
  if (!r) return null;
  r.lesson.analysis.statement = text;
  return { lesson: r.lesson, verify: () => verifyResidueCertificate(r.certificate), label: "Kiểm tra đa thức nguyên và đầy đủ mọi lớp số dư, gồm số âm", family: "residue-classes" };
}

export const NUMBER_THEORY_ROUTINES = [powerResidueLesson, gcdLcmLesson, remaindersLesson, integerEquationLesson, linearDivisorLesson, divisibleForAllLesson];
NUMBER_THEORY_ROUTINES.unshift(consecutiveProductLesson);

// ------------------------------------------------- "P(n) chia hết cho m với mọi n" via consecutive integers
/**
 * Reviewer 2026-10-15 (nt8-h9, 6/10): the residue-class table with "P(n) ≡ P(r)" is too heavy for Grade 9. The usual
 * argument: P(n) = a·(product of k consecutive integers) + m·R(n), and a product of k consecutive integers is divisible by
 * k! (k ≤ 5: one of 2 consecutive is even; among 3 one is divisible by 3 …). Found by exact polynomial arithmetic and
 * used only when m | a·k! and R has integer coefficients.
 */
export function consecutiveProductLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/chứng minh|chứng tỏ/i.test(t)) return null;
  const m = /([0-9a-z^+\-*()]+)\s+(?:luôn\s+)?chia hết cho\s+(\d+)/i.exec(t);
  const domain = domainOf(t);
  if (!m || !domain || !/với mọi/i.test(t)) return null;
  const vars = [...new Set(m[1]!.match(/[a-z]/g) ?? [])];
  if (vars.length !== 1) return null;
  const v = vars[0]!, mod = BigInt(m[2]!);
  const P = integerPolynomial(m[1]!, v);
  if (!P || mod < 2n) return null;
  const deg = P.coefficients.length - 1;
  if (deg < 2 || deg > 5) return null;
  const factorial = (k: number) => { let f = 1n; for (let i = 2n; i <= BigInt(k); i++) f *= i; return f; };
  // Centred product of k consecutive integers: (n - lo)(n - lo + 1)…, lo = floor((k-1)/2).
  const centred = (k: number): bigint[] => {
    const lo = Math.floor((k - 1) / 2);
    let Q: bigint[] = [1n];
    for (let i = 0; i < k; i++) {
      const r = BigInt(i - lo);
      const next = Array<bigint>(Q.length + 1).fill(0n);
      Q.forEach((c, j) => { next[j] = next[j]! + c * r; next[j + 1] = next[j + 1]! + c; });
      Q = next;
    }
    return Q;
  };
  const factorsOf = (k: number) => { const lo = Math.floor((k - 1) / 2); return Array.from({ length: k }, (_, i) => { const r = i - lo; return r === 0 ? v : `(${v}${r > 0 ? "+" : "-"}${Math.abs(r)})`; }).join(""); };
  // P(n) = Σ c_k · (k consecutive integers) + mod·R(n): the leading term is removed by a product of as many consecutive
  // integers, until the rest is a multiple of mod (review 2026-10-15: n⁵ − n ⋮ 30 was a 30-row remainder table; the
  // textbook proof is (n−2)(n−1)n(n+1)(n+2) + 5(n−1)n(n+1)). Each c_k·k! must be divisible by mod.
  const terms: { c: bigint; k: number; Q: bigint[] }[] = [];
  let rest = [...P.coefficients];
  for (let k = deg; k >= 2 && rest.some((c) => c % mod !== 0n); k--) {
    const c = rest[k] ?? 0n;
    if (c === 0n) continue;
    const Q = centred(k);
    if ((c * factorial(k)) % mod !== 0n) return null;
    terms.push({ c, k, Q });
    rest = rest.map((x, i) => x - c * (Q[i] ?? 0n));
  }
  if (!terms.length || rest.some((c) => c % mod !== 0n) || terms.length > 2) return null;
  while (rest.length > 1 && rest[rest.length - 1] === 0n) rest.pop();
  const R = rest.map((c) => c / mod);
  const polyTex = (p: bigint[]) => {
    const out: string[] = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const c = p[i]!; if (c === 0n) continue;
      const ab = c < 0n ? -c : c, body = i === 0 ? String(ab) : `${ab === 1n ? "" : ab}${v}${i > 1 ? `^{${i}}` : ""}`;
      out.push(`${c < 0n ? "-" : out.length ? "+" : ""}${body}`);
    }
    return out.join("") || "0";
  };
  const coefTex = (c: bigint, first: boolean) => (c === 1n ? (first ? "" : "+") : c === -1n ? "-" : c < 0n ? String(c) : first ? String(c) : `+${c}`);
  const restTex = R.every((c) => c === 0n) ? "" : R.filter((c) => c !== 0n).length === 1 ? (() => { const one = polyTex(R.map((c) => c * mod)); return one.startsWith("-") ? one : `+${one}`; })() : `+${mod}\\left(${polyTex(R)}\\right)`;
  const expr = latex(m[1]!);
  const why = (k: number) => k === 2 ? "Trong hai số nguyên liên tiếp luôn có một số chẵn, nên tích chia hết cho $2$."
    : k === 3 ? "Trong ba số nguyên liên tiếp luôn có một số chẵn và một số chia hết cho $3$; vì $2$ và $3$ nguyên tố cùng nhau nên tích chia hết cho $6$."
    : k === 4 ? "Trong bốn số nguyên liên tiếp có một số chia hết cho $3$, và có hai số chẵn liên tiếp, một trong hai số đó chia hết cho $4$, nên tích chia hết cho $2\\cdot4=8$; vì $3$ và $8$ nguyên tố cùng nhau nên tích chia hết cho $24$."
    : "Trong năm số nguyên liên tiếp có một số chia hết cho $5$, có một số chia hết cho $3$, và có hai số chẵn liên tiếp, một trong hai số đó chia hết cho $4$, nên tích chia hết cho $8$; vì $3$, $5$, $8$ đôi một nguyên tố cùng nhau nên tích chia hết cho $120$.";
  const decomposition = `${expr}=${terms.map((t, i) => `${coefTex(t.c, i === 0)}${factorsOf(t.k)}`).join("")}${restTex}`;
  const termWord = terms.length === 1 ? `một tích của ${terms[0]!.k} số nguyên liên tiếp` : `tổng của ${terms.map((t) => `${t.c === 1n ? "" : `${t.c < 0n ? -t.c : t.c} lần `}tích ${t.k} số nguyên liên tiếp`).join(" và ")}`;
  const details: AlgebraDeduction[] = [
    { title: "Tách thành tích các số nguyên liên tiếp", explanation: `Ta viết $${expr}$ thành ${termWord}${restTex ? `, cộng với một bội của $${mod}$` : ""}. Khai triển vế phải để kiểm tra lại.`, math: decomposition, reason: "Khai triển và nhóm hạng tử", question: `Có thể viết biểu thức thành tích của các số nguyên liên tiếp không?` },
    ...terms.map((t): AlgebraDeduction => ({ title: terms.length === 1 ? "Tích các số nguyên liên tiếp" : `Tích ${t.k} số nguyên liên tiếp`, explanation: `${why(t.k)}${t.c === 1n || t.c === -1n ? (factorial(t.k) !== mod ? ` Mà $${factorial(t.k)}$ chia hết cho $${mod}$.` : "") : ` Nhân với $${t.c < 0n ? -t.c : t.c}$: $${(t.c < 0n ? -t.c : t.c)}\\cdot${factorial(t.k)}=${(t.c < 0n ? -t.c : t.c) * factorial(t.k)}$ chia hết cho $${mod}$.`}`, math: `${t.c === 1n || t.c === -1n ? "" : `${t.c < 0n ? -t.c : t.c}`}${factorsOf(t.k)}\\ \\vdots\\ ${t.c === 1n || t.c === -1n ? factorial(t.k) : mod}`, reason: "Tính chất chia hết của tích các số nguyên liên tiếp", question: `Vì sao tích ${t.k} số nguyên liên tiếp chia hết cho $${factorial(t.k)}$?` })),
    { title: "Kết luận", explanation: `Mỗi số hạng ở vế phải đều chia hết cho $${mod}$, nên tổng của chúng chia hết cho $${mod}$. Vậy $${expr}$ chia hết cho $${mod}$ với mọi số ${domainWord(domain)} $${v}$.`, math: `${expr}\\ \\vdots\\ ${mod}`, reason: "Tính chất chia hết của một tổng", question: "Tổng của các số chia hết cho một số thì sao?" },
  ];
  const final = `Vậy $${expr}$ chia hết cho $${mod}$ với mọi số ${domainWord(domain)} $${v}$.`;
  const lesson = lessonOf(text, "Chứng minh chia hết với mọi số nguyên", "Viết biểu thức thành tích các số nguyên liên tiếp cộng với một bội của số chia.", details, final, { givens: [`$${v}$ là số ${domainWord(domain)}`], unknowns: [`Chứng minh $${expr}$ chia hết cho $${mod}$`] });
  // Certificate: the identity holds coefficientwise, and the claim holds on a full window of values.
  const verify = () => {
    const back = P.coefficients.map((_, i) => terms.reduce((s, t) => s + t.c * (t.Q[i] ?? 0n), 0n) + mod * (R[i] ?? 0n));
    if (P.coefficients.some((c, i) => c !== back[i])) return false;
    for (let n = -200n; n <= 200n; n++) if (integerPolynomialValue(P, n) % mod !== 0n) return false;
    return true;
  };
  return lesson ? { lesson, verify, label: "Kiểm tra đẳng thức khai triển và tính chia hết trên mọi giá trị |n| ≤ 200", family: "consecutive-product" } : null;
}
