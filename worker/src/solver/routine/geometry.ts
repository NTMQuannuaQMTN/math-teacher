import { algebraProofLesson, type AlgebraDeduction } from "../algebraProofLesson";
import { flatten, gcd, isqrt } from "./text";
import type { RoutineResult } from "./numberTheory";

/** Exact non-negative rational p/q. Lengths are carried as their squares, so √ stays exact. */
interface Q { p: bigint; q: bigint }
const q = (p: bigint, d = 1n): Q => { if (d < 0n) { p = -p; d = -d; } const g = gcd(p, d) || 1n; return { p: p / g, q: d / g }; };
const mul = (a: Q, b: Q) => q(a.p * b.p, a.q * b.q), div = (a: Q, b: Q) => q(a.p * b.q, a.q * b.p);
const add = (a: Q, b: Q) => q(a.p * b.q + b.p * a.q, a.q * b.q), sub = (a: Q, b: Q) => q(a.p * b.q - b.p * a.q, a.q * b.q);
const num = (a: Q) => Number(a.p) / Number(a.q);
/** √(square) as a rational, when it is one. */
function rationalRoot(s: Q): Q | null {
  const a = isqrt(s.p), b = isqrt(s.q);
  return a * a === s.p && b * b === s.q ? q(a, b) : null;
}
const fracLatex = (a: Q) => (a.q === 1n ? `${a.p}` : `\\frac{${a.p}}{${a.q}}`);
/** LaTeX of √(p/q) in simplest form k√r/d. */
export function rootLatex(s: Q): string {
  const r = rationalRoot(s);
  if (r) return fracLatex(r);
  let n = s.p * s.q, k = 1n;
  for (let f = 2n; f * f <= n; f++) while (n % (f * f) === 0n) { n /= f * f; k *= f; }
  const g = gcd(k, s.q), K = k / g, D = s.q / g;
  const body = `${K === 1n ? "" : K}\\sqrt{${n}}`;
  return D === 1n ? body : `\\frac{${body}}{${D}}`;
}
/** A length given in the text: "6", "2,5", "2.5", "2\sqrt{3}" → its square. */
function parseLength(v: string): Q | null {
  const m = /^(\d+)(?:[.,](\d+))?$/.exec(v);
  if (m) { const d = 10n ** BigInt(m[2]?.length ?? 0); const p = BigInt(m[1]! + (m[2] ?? "")); return q(p * p, d * d); }
  const r = /^(\d*)sqrt\((\d+)\)$/.exec(v);
  if (r) { const k = BigInt(r[1] || "1"); return q(k * k * BigInt(r[2]!)); }
  return null;
}
const lessonOf = (text: string, subtopic: string, strategy: string, details: AlgebraDeduction[], final: string, meta: { givens: string[]; unknowns: string[] }) =>
  algebraProofLesson(text, subtopic, strategy, details, final, { topic: "geometry", ...meta });
const singleTask = (t: string) => !/(?:^|\s)[a-e]\)|\bcâu\s+[a-e]\b|chứng minh/i.test(t);
const norm = (s: string) => s.split("").sort().join("");

/** The segments a "Tính …" sentence asks for (in order). */
function askedSegments(t: string): string[] | null {
  const m = /(?:tính|tìm)\s+(?:độ dài\s+)?(?:các đoạn thẳng\s+|đoạn\s+)?(.*?)(?:\.|$)/i.exec(t);
  if (!m) return null;
  const segs = [...m[1]!.matchAll(/(?<![A-Z])([A-Z]{2})(?![A-Z])/g)].map((x) => x[1]!);
  return segs.length ? segs : null;
}
function givenLengths(t: string): Map<string, Q> | null {
  const out = new Map<string, Q>();
  for (const m of t.matchAll(/(?<![A-Z])([A-Z]{2})=(\d+(?:[.,]\d+)?|\d*sqrt\(\d+\))(?:\s*(?:cm|m|dm|mm))?/g)) {
    const v = parseLength(m[2]!);
    if (!v) return null;
    out.set(norm(m[1]!), v);
  }
  return out;
}
const unit = (t: string) => (/\b(cm|dm|mm)\b/.exec(t)?.[1] ?? (/\d\s*m\b/.test(t) ? "m" : ""));

// ------------------------------------------------------------------------------------- right triangle + altitude
export function rightTriangleLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const tri = /tam giác ([A-Z])([A-Z])([A-Z]) vuông tại ([A-Z])/.exec(t);
  if (!tri) return null;
  const R = tri[4]!, [P, Qv] = [tri[1]!, tri[2]!, tri[3]!].filter((v) => v !== R) as [string, string];
  if (!P || !Qv || ![tri[1], tri[2], tri[3]].includes(R)) return null;
  const alt = new RegExp(`đường cao ${R}([A-Z])`).exec(t);
  const H = alt?.[1];
  const given = givenLengths(t), asked = askedSegments(t);
  if (!given || !asked || given.size < 2) return null;
  const names = new Set([norm(R + P), norm(R + Qv), norm(P + Qv), ...(H ? [norm(R + H), norm(P + H), norm(Qv + H)] : [])]);
  if ([...given.keys(), ...asked.map(norm)].some((k) => !names.has(k))) return null;
  if (/góc|diện tích|chu vi|trung tuyến|phân giác|đường tròn|sin|cos|tan/i.test(t)) return null;
  const s = new Map(given);
  const k = (a: string, b: string) => norm(a + b);
  const [RP, RQ, PQ] = [k(R, P), k(R, Qv), k(P, Qv)];
  const [RH, PH, QH] = H ? [k(R, H), k(P, H), k(Qv, H)] : ["", "", ""];
  const seg = (x: string) => [...x].join(""); // display name
  const details: AlgebraDeduction[] = [];
  const show = (x: string) => {
    const orig = [...asked, ...[...t.matchAll(/(?<![A-Z])([A-Z]{2})=/g)].map((m) => m[1]!)].find((a) => norm(a) === x);
    return orig ?? seg(x);
  };
  type Rel = { needs: string[]; target: string; value: (g: (x: string) => Q) => Q | null; title: string; law: string; formula: (g: (x: string) => Q) => string };
  const rels: Rel[] = [];
  const L = (x: string) => show(x);
  const pyth = (hyp: string, a: string, b: string, tri: string): Rel[] => [
    { needs: [a, b], target: hyp, value: (g) => add(g(a), g(b)), title: `Tính ${L(hyp)}`, law: `Định lí Pythagore trong tam giác ${tri} vuông`, formula: (g) => `${L(hyp)}^2=${L(a)}^2+${L(b)}^2=${fracLatex(g(a))}+${fracLatex(g(b))}=${fracLatex(add(g(a), g(b)))}` },
    { needs: [hyp, b], target: a, value: (g) => { const v = sub(g(hyp), g(b)); return v.p > 0n ? v : null; }, title: `Tính ${L(a)}`, law: `Định lí Pythagore trong tam giác ${tri} vuông`, formula: (g) => `${L(a)}^2=${L(hyp)}^2-${L(b)}^2=${fracLatex(g(hyp))}-${fracLatex(g(b))}=${fracLatex(sub(g(hyp), g(b)))}` },
    { needs: [hyp, a], target: b, value: (g) => { const v = sub(g(hyp), g(a)); return v.p > 0n ? v : null; }, title: `Tính ${L(b)}`, law: `Định lí Pythagore trong tam giác ${tri} vuông`, formula: (g) => `${L(b)}^2=${L(hyp)}^2-${L(a)}^2=${fracLatex(g(hyp))}-${fracLatex(g(a))}=${fracLatex(sub(g(hyp), g(a)))}` },
  ];
  rels.push(...pyth(PQ, RP, RQ, `${tri[1]}${tri[2]}${tri[3]}`));
  if (H) {
    rels.push(...pyth(RP, RH, PH, `${R}${H}${P}`), ...pyth(RQ, RH, QH, `${R}${H}${Qv}`));
    const sys = "Hệ thức lượng trong tam giác vuông";
    // leg² = projection · hypotenuse, altitude² = product of projections, altitude · hyp = leg · leg
    for (const [leg, proj] of [[RP, PH], [RQ, QH]] as const) {
      rels.push({ needs: [proj, PQ], target: leg, value: (g) => rationalRoot(mul(g(proj), g(PQ))), title: `Tính ${L(leg)}`, law: sys, formula: (g) => `${L(leg)}^2=${L(proj)}\\cdot ${L(PQ)}=${rootLatex(g(proj))}\\cdot ${rootLatex(g(PQ))}` });
      rels.push({ needs: [leg, PQ], target: proj, value: (g) => div(mul(g(leg), g(leg)), g(PQ)), title: `Tính ${L(proj)}`, law: sys, formula: (g) => `${L(leg)}^2=${L(proj)}\\cdot ${L(PQ)}\\ \\Rightarrow\\ ${L(proj)}=\\frac{${L(leg)}^2}{${L(PQ)}}=\\frac{${fracLatex(g(leg))}}{${rootLatex(g(PQ))}}` });
    }
    rels.push({ needs: [PH, QH], target: RH, value: (g) => rationalRoot(mul(g(PH), g(QH))), title: `Tính ${L(RH)}`, law: sys, formula: (g) => `${L(RH)}^2=${L(PH)}\\cdot ${L(QH)}=${rootLatex(g(PH))}\\cdot ${rootLatex(g(QH))}` });
    rels.push({ needs: [RP, RQ, PQ], target: RH, value: (g) => div(mul(g(RP), g(RQ)), g(PQ)), title: `Tính ${L(RH)}`, law: sys, formula: (g) => `${L(RH)}\\cdot ${L(PQ)}=${L(RP)}\\cdot ${L(RQ)}\\ \\Rightarrow\\ ${L(RH)}=\\frac{${rootLatex(g(RP))}\\cdot ${rootLatex(g(RQ))}}{${rootLatex(g(PQ))}}` });
    rels.push({ needs: [PH, QH], target: PQ, value: (g) => { const a = rationalRoot(g(PH)), b = rationalRoot(g(QH)); return a && b ? mul(add(a, b), add(a, b)) : null; }, title: `Tính ${L(PQ)}`, law: `$${H}$ nằm giữa $${P}$ và $${Qv}$`, formula: (g) => `${L(PQ)}=${L(PH)}+${L(QH)}=${rootLatex(g(PH))}+${rootLatex(g(QH))}` });
    for (const [a, b] of [[PH, QH], [QH, PH]] as const)
      rels.push({ needs: [PQ, a], target: b, value: (g) => { const x = rationalRoot(g(PQ)), y = rationalRoot(g(a)); if (!x || !y) return null; const d = sub(x, y); return d.p > 0n ? mul(d, d) : null; }, title: `Tính ${L(b)}`, law: `$${H}$ nằm giữa $${P}$ và $${Qv}$`, formula: (g) => `${L(b)}=${L(PQ)}-${L(a)}=${rootLatex(g(PQ))}-${rootLatex(g(a))}` });
  }
  // The direct relation AH·BC = AB·AC before a detour through the projections.
  if (H) rels.sort((a, b) => Number(b.target === RH && b.needs.length === 3) - Number(a.target === RH && a.needs.length === 3));
  const g = (x: string) => s.get(x)!;
  const askedK = asked.map(norm);
  for (let round = 0; round < 12 && askedK.some((a) => !s.has(a)); round++) {
    let progressed = false;
    for (const r of rels) {
      if (s.has(r.target) || !r.needs.every((n) => s.has(n))) continue;
      const v = r.value(g);
      if (!v || v.p <= 0n) continue;
      s.set(r.target, v);
      details.push({ title: r.title, explanation: `Áp dụng ${r.law.startsWith("$") ? r.law : r.law.charAt(0).toLowerCase() + r.law.slice(1)}:`, math: `${r.formula(g)}\\ \\Rightarrow\\ ${L(r.target)}=${rootLatex(v)}`, reason: r.law, question: `Đã biết những đoạn nào để tính được ${L(r.target)}?` });
      progressed = true;
      break;
    }
    if (!progressed) return null;
  }
  if (askedK.some((a) => !s.has(a))) return null;
  // Certificate: coordinates from the two legs; every length (given or derived) must match the measurement.
  const legs = [s.get(RP), s.get(RQ)];
  const verify = () => {
    let a = legs[0] ?? null, b = legs[1] ?? null;
    if (!a || !b) {
      // derive the legs from what is known for the measurement only
      const all = new Map(s);
      for (let i = 0; i < 6; i++) for (const r of rels) if (!all.has(r.target) && r.needs.every((n) => all.has(n))) { const v = r.value((x) => all.get(x)!); if (v && v.p > 0n) all.set(r.target, v); }
      a = all.get(RP) ?? null; b = all.get(RQ) ?? null;
      if (!a || !b) return false;
    }
    const x = Math.sqrt(num(a)), y = Math.sqrt(num(b));
    const pts: Record<string, [number, number]> = { [R]: [0, 0], [P]: [x, 0], [Qv]: [0, y] };
    if (H) { const tt = (x * x) / (x * x + y * y); pts[H] = [x + (0 - x) * tt, 0 + y * tt]; }
    for (const [key, v] of s) {
      const [u, w] = [...key] as [string, string];
      const d = Math.hypot(pts[u]![0] - pts[w]![0], pts[u]![1] - pts[w]![1]);
      if (Math.abs(d - Math.sqrt(num(v))) > 1e-9 * Math.max(1, d)) return false;
    }
    return true;
  };
  const u = unit(t);
  const answers = asked.map((a) => `$${a}=${rootLatex(s.get(norm(a))!)}${u ? `\\text{ ${u}}` : ""}$`);
  const final = `Vậy ${answers.join(", ")}.`;
  details.unshift({ title: "Xác định tam giác vuông và các yếu tố đã biết", explanation: `Tam giác $${tri[1]}${tri[2]}${tri[3]}$ vuông tại $${R}$, cạnh huyền $${P}${Qv}$${H ? `, đường cao $${R}${H}$ (nên $${H}$ nằm giữa $${P}$ và $${Qv}$, các tam giác $${R}${H}${P}$, $${R}${H}${Qv}$ vuông tại $${H}$)` : ""}. Đã biết: ${[...given.entries()].map(([k2, v]) => `$${show(k2)}=${rootLatex(v)}$`).join(", ")}.`, math: null, reason: "Phân tích giả thiết", question: "Cạnh huyền là cạnh nào?" });
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Hệ thức lượng trong tam giác vuông", "Dùng định lí Pythagore và các hệ thức lượng, tính dần từ các đoạn đã biết.", details, final, { givens: [...given.entries()].map(([k2, v]) => `$${show(k2)}=${rootLatex(v)}$`), unknowns: asked.map((a) => `$${a}$`) });
  return lesson ? { lesson, verify, label: "Dựng tam giác bằng tọa độ và đo lại mọi độ dài đã cho và đã tính", family: "right-triangle" } : null;
}

// ------------------------------------------------------------------------------------------ circle: chord, tangent
export function circleLengthLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const rm = /\(([A-Z]);\s*(\d+(?:[.,]\d+)?)(?:\s*(?:cm|m|dm|mm))?\)|bán kính (?:bằng |R=)?(\d+(?:[.,]\d+)?)/i.exec(t);
  const center = /\(([A-Z])[;)]|tâm ([A-Z])\b/.exec(t);
  if (!rm || !center) return null;
  const O = (center[1] ?? center[2])!, R2 = parseLength((rm[2] ?? rm[3])!.replace(",", "."))!;
  if (/góc|diện tích|chu vi|chứng minh|hai tiếp tuyến|cát tuyến/i.test(t)) return null;
  const u = unit(t);
  const withUnit = (v: string) => `${v}${u ? `\\text{ ${u}}` : ""}`;
  const details: AlgebraDeduction[] = [];
  let final: string, verify: () => boolean, family: string, givens: string[], unknowns: string[];
  const chord = /dây ([A-Z]{2})(?:=| dài | có độ dài )(\d+(?:[.,]\d+)?)/.exec(t);
  const chordDist = /dây ([A-Z]{2}) cách (?:tâm )?(?:[A-Z] )?(?:một khoảng |một đoạn )?(?:bằng |là )?(\d+(?:[.,]\d+)?)/.exec(t);
  const tangent = /tiếp tuyến ([A-Z])([A-Z])/.exec(t);
  const om = tangent ? new RegExp(`(?:${O}${tangent[1]}|${tangent[1]}${O})=(\\d+(?:[.,]\\d+)?)`).exec(t) : null;
  if (chord && /khoảng cách từ/i.test(t)) {
    family = "chord-distance";
    const c2 = parseLength(chord[2]!.replace(",", "."))!, AB = chord[1]!;
    const half = div(c2, q(4n)), d2 = sub(R2, half);
    if (d2.p <= 0n) return null;
    details.push({ title: "Kẻ đường vuông góc từ tâm đến dây", explanation: `Kẻ $${O}H\\perp ${AB}$ tại $H$. Khoảng cách từ $${O}$ đến dây $${AB}$ là $${O}H$. Vì $${O}${AB[0]}=${O}${AB[1]}$ (bán kính) nên tam giác $${O}${AB}$ cân tại $${O}$, đường cao $${O}H$ cũng là đường trung tuyến: $H$ là trung điểm của $${AB}$.`, math: `${AB[0]}H=\\frac{${AB}}{2}=${rootLatex(half)}`, reason: "Đường kính (bán kính) vuông góc với dây thì đi qua trung điểm của dây", question: `Chân đường vuông góc từ tâm đến dây là điểm đặc biệt nào?` });
    details.push({ title: `Tính ${O}H`, explanation: `Tam giác $${O}H${AB[0]}$ vuông tại $H$, áp dụng định lí Pythagore:`, math: `${O}H^2=${O}${AB[0]}^2-${AB[0]}H^2=${fracLatex(R2)}-${fracLatex(half)}=${fracLatex(d2)}\\ \\Rightarrow\\ ${O}H=${withUnit(rootLatex(d2))}`, reason: "Định lí Pythagore", question: "Tam giác nào vuông để áp dụng Pythagore?" });
    final = `Vậy khoảng cách từ $${O}$ đến dây $${AB}$ là $${withUnit(rootLatex(d2))}$.`;
    verify = () => Math.abs(Math.hypot(Math.sqrt(num(d2)), Math.sqrt(num(c2)) / 2) - Math.sqrt(num(R2))) < 1e-9;
    givens = [`$R=${rootLatex(R2)}$`, `$${AB}=${rootLatex(c2)}$`]; unknowns = ["Khoảng cách từ tâm đến dây"];
  } else if (chordDist) {
    family = "chord-length";
    const AB = chordDist[1]!, dd = parseLength(chordDist[2]!.replace(",", "."))!, half = sub(R2, dd);
    if (half.p <= 0n) return null;
    const full = mul(half, q(4n));
    details.push({ title: "Kẻ đường vuông góc từ tâm đến dây", explanation: `Kẻ $${O}H\\perp ${AB}$ tại $H$, khi đó $${O}H=${rootLatex(dd)}$ là khoảng cách từ tâm đến dây. Tam giác $${O}${AB}$ cân tại $${O}$ (hai bán kính) nên $H$ là trung điểm của $${AB}$.`, math: null, reason: "Đường kính vuông góc với dây thì đi qua trung điểm của dây", question: "H là điểm gì của dây?" });
    details.push({ title: `Tính nửa dây rồi cả dây`, explanation: `Tam giác $${O}H${AB[0]}$ vuông tại $H$: theo định lí Pythagore, rồi nhân đôi.`, math: `${AB[0]}H^2=${O}${AB[0]}^2-${O}H^2=${fracLatex(R2)}-${fracLatex(dd)}=${fracLatex(half)},\\quad ${AB}=2\\cdot ${AB[0]}H=${withUnit(rootLatex(full))}`, reason: "Định lí Pythagore", question: "Nửa dây dài bao nhiêu?" });
    final = `Vậy $${AB}=${withUnit(rootLatex(full))}$.`;
    verify = () => Math.abs(Math.hypot(Math.sqrt(num(dd)), Math.sqrt(num(full)) / 2) - Math.sqrt(num(R2))) < 1e-9;
    givens = [`$R=${rootLatex(R2)}$`, `khoảng cách $${rootLatex(dd)}$`]; unknowns = [`$${AB}$`];
  } else if (tangent && om && !/hai tiếp tuyến/i.test(t)) {
    family = "tangent-length";
    const M = tangent[1]!, A = tangent[2]!, d2 = parseLength(om[1]!.replace(",", "."))!, t2 = sub(d2, R2);
    if (t2.p <= 0n) return null;
    details.push({ title: "Tiếp tuyến vuông góc với bán kính", explanation: `$${M}${A}$ là tiếp tuyến tại $${A}$ nên $${M}${A}\\perp ${O}${A}$: tam giác $${O}${A}${M}$ vuông tại $${A}$, với $${O}${A}=${rootLatex(R2)}$ (bán kính) và cạnh huyền $${O}${M}=${rootLatex(d2)}$.`, math: `${M}${A}\\perp ${O}${A}`, reason: "Tính chất tiếp tuyến: vuông góc với bán kính tại tiếp điểm", question: "Góc nào giữa tiếp tuyến và bán kính là góc vuông?" });
    details.push({ title: `Tính ${M}${A}`, explanation: "Áp dụng định lí Pythagore:", math: `${M}${A}^2=${O}${M}^2-${O}${A}^2=${fracLatex(d2)}-${fracLatex(R2)}=${fracLatex(t2)}\\ \\Rightarrow\\ ${M}${A}=${withUnit(rootLatex(t2))}`, reason: "Định lí Pythagore", question: "Cạnh huyền của tam giác vuông là cạnh nào?" });
    final = `Vậy $${M}${A}=${withUnit(rootLatex(t2))}$.`;
    verify = () => Math.abs(Math.hypot(Math.sqrt(num(t2)), Math.sqrt(num(R2))) - Math.sqrt(num(d2))) < 1e-9;
    givens = [`$R=${rootLatex(R2)}$`, `$${O}${M}=${rootLatex(d2)}$`]; unknowns = [`$${M}${A}$`];
  } else return null;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Dây và tiếp tuyến của đường tròn", "Đưa về tam giác vuông có cạnh huyền là bán kính (hoặc đoạn nối tâm), rồi dùng định lí Pythagore.", details, final, { givens, unknowns });
  return lesson ? { lesson, verify, label: "Dựng lại tam giác vuông bằng số và kiểm tra cạnh huyền", family } : null;
}

// ----------------------------------------------------------------------------------------------- Thales (DE ∥ BC)
export function thalesLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t)) return null;
  const par = /([A-Z])([A-Z])\s*∥\s*([A-Z])([A-Z])|([A-Z])([A-Z]) song song (?:với )?([A-Z])([A-Z])/.exec(t);
  const tri = /tam giác ([A-Z])([A-Z])([A-Z])/.exec(t);
  if (!par || !tri) return null;
  const [D, E, B, C] = (par[1] ? [par[1], par[2], par[3], par[4]] : [par[5], par[6], par[7], par[8]]) as [string, string, string, string];
  const A = [tri[1], tri[2], tri[3]].find((v) => v !== B && v !== C);
  if (!A || ![tri[1], tri[2], tri[3]].includes(B) || ![tri[1], tri[2], tri[3]].includes(C)) return null;
  if (!new RegExp(`${D} (?:thuộc|nằm trên|trên) (?:cạnh )?(?:${A}${B}|${B}${A})`).test(t) || !new RegExp(`${E} (?:thuộc|nằm trên|trên) (?:cạnh )?(?:${A}${C}|${C}${A})`).test(t)) return null;
  const given = givenLengths(t), asked = askedSegments(t);
  if (!given || !asked || /góc|diện tích|chu vi|chứng minh/i.test(t)) return null;
  const k = (a: string, b: string) => norm(a + b);
  const lin = new Map<string, Q>(); // actual lengths (rational only)
  for (const [key, v] of given) { const r = rationalRoot(v); if (!r) return null; lin.set(key, r); }
  const AD = k(A, D), DB = k(D, B), AB = k(A, B), AE = k(A, E), EC = k(E, C), AC = k(A, C), DE = k(D, E), BC = k(B, C);
  if ([...lin.keys(), ...asked.map(norm)].some((x) => ![AD, DB, AB, AE, EC, AC, DE, BC].includes(x))) return null;
  const details: AlgebraDeduction[] = [];
  const nm = (x: string) => [...asked, ...[...t.matchAll(/(?<![A-Z])([A-Z]{2})=/g)].map((m) => m[1]!)].find((a) => norm(a) === x) ?? x;
  const step = (title: string, math: string, reason: string) => details.push({ title, explanation: `${reason}:`, math, reason, question: `Dùng hệ thức nào để tính?` });
  for (let i = 0; i < 10; i++) {
    const has = (x: string) => lin.has(x), g = (x: string) => lin.get(x)!;
    if (!has(AB) && has(AD) && has(DB)) { lin.set(AB, add(g(AD), g(DB))); step(`Tính ${nm(AB)}`, `${nm(AB)}=${nm(AD)}+${nm(DB)}=${fracLatex(g(AB))}`, `$${D}$ nằm giữa $${A}$ và $${B}$`); continue; }
    if (!has(AC) && has(AE) && has(EC)) { lin.set(AC, add(g(AE), g(EC))); step(`Tính ${nm(AC)}`, `${nm(AC)}=${nm(AE)}+${nm(EC)}=${fracLatex(g(AC))}`, `$${E}$ nằm giữa $${A}$ và $${C}$`); continue; }
    if (!has(DB) && has(AB) && has(AD)) { lin.set(DB, sub(g(AB), g(AD))); step(`Tính ${nm(DB)}`, `${nm(DB)}=${nm(AB)}-${nm(AD)}=${fracLatex(g(DB))}`, `$${D}$ nằm giữa $${A}$ và $${B}$`); continue; }
    if (!has(EC) && has(AC) && has(AE)) { lin.set(EC, sub(g(AC), g(AE))); step(`Tính ${nm(EC)}`, `${nm(EC)}=${nm(AC)}-${nm(AE)}=${fracLatex(g(EC))}`, `$${E}$ nằm giữa $${A}$ và $${C}$`); continue; }
    // ratio k = AD/AB = AE/AC = DE/BC
    const ratio = has(AD) && has(AB) ? div(g(AD), g(AB)) : has(AE) && has(AC) ? div(g(AE), g(AC)) : has(DE) && has(BC) ? div(g(DE), g(BC)) : null;
    const ratioFrom = has(AD) && has(AB) ? `\\frac{${nm(AD)}}{${nm(AB)}}` : has(AE) && has(AC) ? `\\frac{${nm(AE)}}{${nm(AC)}}` : `\\frac{${nm(DE)}}{${nm(BC)}}`;
    if (!ratio) break;
    const law = `Vì $${D}${E}\\parallel ${B}${C}$, theo hệ quả của định lí Thales (tam giác $${A}${D}${E}$ đồng dạng với tam giác $${A}${B}${C}$)`;
    const pairs: [string, string][] = [[AD, AB], [AE, AC], [DE, BC]];
    let done = false;
    for (const [small, big] of pairs) {
      if (has(small) && !has(big)) { lin.set(big, div(g(small), ratio)); step(`Tính ${nm(big)}`, `\\frac{${nm(small)}}{${nm(big)}}=${ratioFrom}=${fracLatex(ratio)}\\ \\Rightarrow\\ ${nm(big)}=${fracLatex(g(big))}`, law); done = true; break; }
      if (has(big) && !has(small)) { lin.set(small, mul(g(big), ratio)); step(`Tính ${nm(small)}`, `\\frac{${nm(small)}}{${nm(big)}}=${ratioFrom}=${fracLatex(ratio)}\\ \\Rightarrow\\ ${nm(small)}=${fracLatex(g(small))}`, law); done = true; break; }
    }
    if (!done) break;
  }
  if (asked.some((a) => !lin.has(norm(a)))) return null;
  const u = unit(t);
  const final = `Vậy ${asked.map((a) => `$${a}=${fracLatex(lin.get(norm(a))!)}${u ? `\\text{ ${u}}` : ""}$`).join(", ")}.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const verify = () => {
    const g = (x: string) => (lin.has(x) ? num(lin.get(x)!) : null);
    const r1 = g(AD) != null && g(AB) != null ? g(AD)! / g(AB)! : null, r2 = g(AE) != null && g(AC) != null ? g(AE)! / g(AC)! : null, r3 = g(DE) != null && g(BC) != null ? g(DE)! / g(BC)! : null;
    const rs = [r1, r2, r3].filter((x): x is number => x != null);
    const sums = [[AD, DB, AB], [AE, EC, AC]].every(([a, b, c]) => g(a!) == null || g(b!) == null || g(c!) == null || Math.abs(g(a!)! + g(b!)! - g(c!)!) < 1e-9);
    return rs.length > 0 && rs.every((r) => Math.abs(r - rs[0]!) < 1e-9 && r > 0 && r < 1) && sums;
  };
  const lesson = lessonOf(text, "Định lí Thales và hệ quả", "Dùng tỉ số bằng nhau do đường thẳng song song với một cạnh của tam giác tạo ra.", details, final, { givens: [`$${D}${E}\\parallel ${B}${C}$`, ...[...given.entries()].map(([k2, v]) => `$${nm(k2)}=${rootLatex(v)}$`)], unknowns: asked.map((a) => `$${a}$`) });
  return lesson ? { lesson, verify, label: "Kiểm tra lại các tỉ số Thales và các tổng đoạn thẳng", family: "thales" } : null;
}

export const GEOMETRY_ROUTINES = [rightTriangleLesson, circleLengthLesson, thalesLesson];

// ------------------------------------------------------------------------------- area of a triangle from its sides
/** "Cho tam giác ABC có AB=c, AC=b, BC=a. Tính diện tích": drop the altitude AH, solve for BH (Grade 9, no Heron). */
export function triangleAreaLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!/diện tích/i.test(t) || /vuông|cân|đều|đường tròn|(?:^|\s)[a-e]\)/i.test(t)) return null;
  const tri = /tam giác ([A-Z])([A-Z])([A-Z])/.exec(t);
  const given = givenLengths(t);
  if (!tri || !given || given.size !== 3) return null;
  const [A, B, C] = [tri[1]!, tri[2]!, tri[3]!];
  const sides = [norm(A + B), norm(A + C), norm(B + C)];
  if (!sides.every((x) => given.has(x))) return null;
  const c2 = given.get(norm(A + B))!, b2 = given.get(norm(A + C))!, a2 = given.get(norm(B + C))!;
  const a = rationalRoot(a2), b = rationalRoot(b2), c = rationalRoot(c2);
  if (!a || !b || !c) return null;
  // Use the longest side as the base so that the foot H lies on it (both other angles are acute).
  const [base, P, Qp, X] = num(a) >= num(b) && num(a) >= num(c) ? [a, B, C, A] : num(b) >= num(c) ? [b, A, C, B] : [c, A, B, C];
  const sideTo = (u: string, v: string) => rationalRoot(given.get(norm(u + v))!)!;
  const p = sideTo(X, P), r = sideTo(X, Qp);
  if (num(p) + num(r) <= num(base) || Math.abs(num(p) - num(r)) >= num(base)) return null;
  // PH = x: XP² − x² = XQ² − (base − x)²  ⇒  x = (XP² − XQ² + base²) / (2·base)
  const x = div(add(sub(mul(p, p), mul(r, r)), mul(base, base)), mul(q(2n), base));
  const h2 = sub(mul(p, p), mul(x, x));
  if (h2.p <= 0n) return null;
  const areaSq = div(mul(mul(base, base), h2), q(4n));
  const u = unit(t);
  const details: AlgebraDeduction[] = [
    { title: "Kẻ đường cao xuống cạnh lớn nhất", explanation: `Cạnh lớn nhất là $${P}${Qp}=${fracLatex(base)}$, nên hai góc kề cạnh đó là góc nhọn và chân đường cao $H$ từ $${X}$ nằm giữa $${P}$ và $${Qp}$. Đặt $${P}H=x$, khi đó $H${Qp}=${fracLatex(base)}-x$.`, math: null, reason: "Góc đối diện cạnh lớn nhất là góc lớn nhất; hai góc còn lại nhọn", question: "Vì sao chọn cạnh lớn nhất làm đáy?" },
    { title: "Lập phương trình theo x", explanation: `Hai tam giác $${X}H${P}$ và $${X}H${Qp}$ vuông tại $H$ có chung cạnh $${X}H$. Áp dụng định lí Pythagore cho cả hai và cho hai biểu thức của $${X}H^2$ bằng nhau.`, math: `${fracLatex(mul(p, p))}-x^2=${fracLatex(mul(r, r))}-(${fracLatex(base)}-x)^2\\ \\Rightarrow\\ ${fracLatex(mul(q(2n), base))}x=${fracLatex(add(sub(mul(p, p), mul(r, r)), mul(base, base)))}\\ \\Rightarrow\\ x=${fracLatex(x)}`, reason: "Định lí Pythagore", question: "Khai triển $(a-x)^2$ thì $x^2$ có triệt tiêu không?" },
    { title: "Tính đường cao", explanation: `Thay $x$ vào tam giác $${X}H${P}$:`, math: `${X}H^2=${fracLatex(mul(p, p))}-\\left(${fracLatex(x)}\\right)^2=${fracLatex(h2)}\\ \\Rightarrow\\ ${X}H=${rootLatex(h2)}`, reason: "Định lí Pythagore", question: "Đường cao bằng bao nhiêu?" },
    { title: "Tính diện tích", explanation: "Diện tích bằng nửa tích đáy và chiều cao.", math: `S=\\frac12\\cdot ${P}${Qp}\\cdot ${X}H=\\frac12\\cdot ${fracLatex(base)}\\cdot ${rootLatex(h2)}=${rootLatex(areaSq)}`, reason: "Công thức diện tích tam giác", question: "Công thức diện tích tam giác là gì?" },
  ];
  const final = `Vậy diện tích tam giác $${A}${B}${C}$ là $${rootLatex(areaSq)}${u ? `\\text{ ${u}}^2` : ""}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Tính diện tích tam giác biết ba cạnh", "Kẻ đường cao, dùng định lí Pythagore hai lần để tìm hình chiếu, rồi tính đường cao và diện tích.", details, final, { givens: [`$${A}${B}=${fracLatex(c)}$`, `$${A}${C}=${fracLatex(b)}$`, `$${B}${C}=${fracLatex(a)}$`], unknowns: ["Diện tích"] });
  const verify = () => { const [aa, bb, cc] = [num(a), num(b), num(c)], s = (aa + bb + cc) / 2; return Math.abs(Math.sqrt(s * (s - aa) * (s - bb) * (s - cc)) - Math.sqrt(num(areaSq))) < 1e-9 * Math.max(1, s * s); };
  return lesson ? { lesson, verify, label: "Đối chiếu với công thức Heron (độc lập với cách tính bằng đường cao)", family: "triangle-area" } : null;
}
GEOMETRY_ROUTINES.push(triangleAreaLesson);
