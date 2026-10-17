import { parseExpression, splitRelation } from "../../../shared/src/expr";
import { expressionSource } from "../../../shared/src/expressionSource";
import { parseMathText } from "../../../shared/src/mathText";
import { algebraProofLesson, type AlgebraDeduction } from "./algebraProofLesson";

type Q = { n: bigint; d: bigint };
type Certificate = { x: string; y: string; k: bigint; sum: bigint; product: bigint; auxiliary: bigint[]; pairs: [Q, Q][] };
const abs = (n: bigint) => n < 0n ? -n : n;
const gcd = (a: bigint, b: bigint): bigint => b === 0n ? abs(a) : gcd(b, a % b);
const q = (n: bigint, d = 1n): Q => { if (d < 0n) { n = -n; d = -d; } const g = gcd(abs(n), d) || 1n; return { n: n / g, d: d / g }; };
const tex = (v: Q) => v.d === 1n ? String(v.n) : `${v.n < 0n ? "-" : ""}\\frac{${abs(v.n)}}{${v.d}}`;
const squareRoot = (n: bigint): bigint | null => { if (n < 0n) return null; let lo = 0n, hi = n + 1n; while (hi - lo > 1n) { const mid = (lo + hi) / 2n; if (mid * mid <= n) lo = mid; else hi = mid; } return lo * lo === n ? lo : null; };
const equal = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
const value = (v: Q, k: bigint) => q(k * v.n * v.n + v.d * v.d, v.n * v.d);
const quadratic = (a: bigint, b: bigint, c: bigint): Q[] | null => {
  const root = squareRoot(b * b - 4n * a * c); if (root === null) return null;
  const values = [q(-b - root, 2n * a), q(-b + root, 2n * a)];
  return values.filter((v, i) => i === 0 || !equal(v, values[0]!));
};

function parse(text: string): Certificate | null {
  const match = /^Giải hệ phương trình(?: sau)?\s*:?\s*([\s\S]+?)\.?$/iu.exec(text.trim()); if (!match) return null;
  const segments = parseMathText(match[1]!); const maths = segments.filter((s) => s.kind === "math");
  if (maths.length !== 1 || segments.some((s) => s.kind === "text" && s.value.trim())) return null;
  const body = /^\\begin\{cases\}([\s\S]+)\\end\{cases\}$/u.exec(maths[0]!.value.trim()); if (!body) return null;
  const equations = body[1]!.split(/\\\\|\\cr\b/u).map((s) => {
    const relation=splitRelation(s.replace(/&/g,"").replace(/^\s*,|,\s*$/g,""));if(!relation||relation.rel!=="=")return "";
    // A system this module does not read (agent trial 2026-10-16: "1+12(x+y)=…" threw "Bad number") is declined, not a crash.
    try { return `${expressionSource(parseExpression(relation.sides[0]))}=${expressionSource(parseExpression(relation.sides[1]))}`; } catch { return ""; }
  });
  if (equations.length !== 2) return null;
  const first = /^\(\(([a-z])\+([a-z])\)\*\((\d+)\+\(1\/\(\1\*\2\)\)\)\)=(-?\d+)$/iu.exec(equations[0]!); if (!first) return null;
  const [, x, y, ks, ss] = first;
  const second = new RegExp(`^\\(\\(\\(${ks}\\*${x}\\)\\+\\(1\\/${x}\\)\\)\\*\\(\\(${ks}\\*${y}\\)\\+\\(1\\/${y}\\)\\)\\)=\\((-?\\d+)\\)$`, "iu").exec(equations[1]!); if (!second) return null;
  const k = BigInt(ks!), sum = BigInt(ss!), product = BigInt(second[1]!); if (k <= 0n) return null;
  const auxiliaryRoots = quadratic(1n, -sum, product); if (!auxiliaryRoots || auxiliaryRoots.some((v) => v.d !== 1n)) return null;
  const auxiliary = auxiliaryRoots.map((v) => v.n), assignments: [bigint, bigint][] = auxiliary.length === 1 ? [[auxiliary[0]!, auxiliary[0]!]] : [[auxiliary[0]!, auxiliary[1]!], [auxiliary[1]!, auxiliary[0]!]];
  const pairs: [Q, Q][] = [];
  for (const [u, v] of assignments) {
    const xs = quadratic(k, -u, 1n), ys = quadratic(k, -v, 1n); if (!xs || !ys) return null;
    for (const xv of xs) for (const yv of ys) pairs.push([xv, yv]);
  }
  const certificate = { x: x!, y: y!, k, sum, product, auxiliary, pairs };
  return verifyReciprocalSystemCertificate(certificate) ? certificate : null;
}

export function verifyReciprocalSystemCertificate(c: Certificate): boolean {
  if (c.k <= 0n || c.pairs.length === 0) return false;
  return c.pairs.every(([x, y]) => x.n !== 0n && y.n !== 0n && (() => {
    const u = value(x, c.k), v = value(y, c.k);
    return u.d === 1n && v.d === 1n && u.n + v.n === c.sum && u.n * v.n === c.product;
  })());
}

export function reciprocalSystemLesson(text: string) {
  const c = parse(text); if (!c) return null;
  const [u, v] = c.auxiliary, x = c.x, y = c.y, pairText = c.pairs.map(([a, b]) => `(${tex(a)},${tex(b)})`);
  const rootsFor = (w: bigint) => quadratic(c.k, -w, 1n)!.map(tex).join("; ");
  const details: AlgebraDeduction[] = [
    { title: "Nêu điều kiện và đặt hai biểu thức phụ", explanation: `Các mẫu cho $${x}\\ne0$, $${y}\\ne0$. Đặt $U=${c.k}${x}+\\frac1{${x}}$ và $V=${c.k}${y}+\\frac1{${y}}$; đây là hai biểu thức xuất hiện tự nhiên trong hệ.`, math: `${x}${y}\\ne0,\\quad U=${c.k}${x}+\\frac1{${x}},\\quad V=${c.k}${y}+\\frac1{${y}}`, reason: "Điều kiện xác định và phép đặt ẩn phụ", question: "Hai biểu thức nào lặp lại trong cả hai phương trình?" },
    { title: "Biến đổi phương trình đầu thành tổng của hai ẩn phụ", explanation: "Khai triển đầy đủ vế trái; hai phân thức có chung mẫu tích được tách thành hai nghịch đảo. Vì vậy phương trình đầu cho đúng tổng $U+V$, không phải một suy đoán.", math: `(${x}+${y})\\left(${c.k}+\\frac1{${x}${y}}\\right)=${c.k}${x}+${c.k}${y}+\\frac1{${x}}+\\frac1{${y}}=U+V=${c.sum}`, reason: "Phân phối phép nhân và tách phân thức", question: "Khai triển vế trái cho tổng nào của $U,V$?" },
    { title: "Dùng phương trình thứ hai để có tích", explanation: `Theo định nghĩa, vế trái phương trình thứ hai là $UV$. Hai ẩn phụ do đó có tổng $${c.sum}$ và tích $${c.product}$, nên là các nghiệm của một phương trình bậc hai.`, math: `UV=${c.product},\\qquad t^2-${c.sum}t+(${c.product})=0`, reason: "Vi-ét đảo", question: "Phương trình bậc hai nào có hai nghiệm là $U,V$?" },
    { title: "Giải phương trình của hai ẩn phụ và xét thứ tự", explanation: `Phương trình bậc hai cho hai giá trị $${u}$ và $${v}$. Vì $U$ gắn với $${x}$ còn $V$ gắn với $${y}$, phải xét cả hai thứ tự nếu hai giá trị khác nhau.`, math: c.auxiliary.length === 1 ? `U=V=${u}` : `(U,V)=(${u},${v})\\quad\\text{hoặc}\\quad(U,V)=(${v},${u})`, reason: "Công thức nghiệm và các cặp có thứ tự", question: "Có cần đổi chỗ hai nghiệm của phương trình phụ không?" },
    { title: `Giải riêng các phương trình theo $${x}$ và $${y}$`, explanation: `Với một giá trị $W$ của ẩn phụ, phương trình $${c.k}z+1/z=W$ tương đương $${c.k}z^2-Wz+1=0$ vì $z\\ne0$. Giải cho từng giá trị phụ: $W=${u}$ cho $z\\in\\{${rootsFor(u!)}\\}$; $W=${v}$ cho $z\\in\\{${rootsFor(v!)}\\}$.`, math: `${c.k}z+\\frac1z=W\\Longleftrightarrow ${c.k}z^2-Wz+1=0`, reason: "Nhân với số khác không rồi giải phương trình bậc hai", question: "Mỗi giá trị của ẩn phụ cho những giá trị nào của ẩn ban đầu?" },
    { title: "Ghép mọi khả năng, kiểm tra và kết luận", explanation: `Ghép theo cả hai thứ tự ở bước trước được đúng các cặp: ${pairText.map((p) => `$${p}$`).join(", ")}. Với từng cặp, các giá trị $U,V$ có tổng $${c.sum}$ và tích $${c.product}$, nên thỏa cả hai phương trình ban đầu. Ngược lại, mọi nghiệm của hệ phải đi qua các bước tương đương trên, nên không còn cặp nào khác.`, math: `(${x},${y})\\in\\{${pairText.join(";")}\\}`, reason: "Kiểm tra hai phương trình và chứng minh tính đầy đủ", question: "Các cặp đã liệt kê có thỏa cả tổng và tích không, và vì sao không còn nghiệm khác?" },
  ];
  const final = `Vậy hệ có tất cả các nghiệm $(${x},${y})\\in\\{${pairText.join(";")}\\}$.`;
  const lesson = algebraProofLesson(text, "Hệ đối xứng qua biểu thức nghịch đảo", "Đặt hai biểu thức phụ, chuyển hệ về tổng và tích, giải phương trình bậc hai rồi xét đủ các cặp có thứ tự.", details, final, { topic: "system", givens: [text], unknowns: [`Tất cả cặp số thực $(${x},${y})$`], constraints: [`$${x}${y}\\ne0$`] });
  return lesson ? { lesson, certificate: c } : null;
}
