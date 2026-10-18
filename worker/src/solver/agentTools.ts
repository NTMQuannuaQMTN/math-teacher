import { computeAnswers } from "../../../shared/src/oracle";
import { evalCondition, evalExpression, variablesOf } from "../../../shared/src/expr";
import { evaluateFigureCheck, resolveFigure } from "../../../shared/src/geometry";
import { figureFromStatement } from "../../../shared/src/figureFromText";
import { expressionMod } from "../../../shared/src/integerTargets";
import { exactArithmeticIdentity } from "../../../shared/src/polynomialIdentity";
import { FigureCheckSchema, FigureSchema, PointKindSchema, type Figure, type PointDef } from "../../../shared/src/solution";
import { solveTakeAway } from "./takeAwayGame";

/**
 * Per-type tools of the SOCLAAS agent (2026-10-17): the question is classified first, then the model gets the tools of
 * its type. Every tool is exact or exhaustive within a stated range; each result says what it is (a computation, a
 * search in a window, a measurement on a figure) so the lesson still has to prove it.
 */
export type ProblemType = "algebra" | "geometry" | "number_theory" | "combinatorics";
export const PROBLEM_TYPES: ProblemType[] = ["algebra", "geometry", "number_theory", "combinatorics"];

type ToolDef = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };
const fn = (name: string, description: string, properties: Record<string, unknown>, required = Object.keys(properties)): ToolDef => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } },
});
const str = { type: "string" }, int = { type: "integer" }, num = { type: "number" }, nullableNum = { type: ["number", "null"] };

// ---------------------------------------------------------------- shared helpers

/** "a = b": exact identity when both sides are polynomials/rationals, else sampled at positive values of the variables. */
function evaluate(expression: string): string {
  const e = expression.trim();
  const sides = e.split(/(?<![<>!])=(?!=)/);
  try {
    if (sides.length === 2) {
      const id = exactArithmeticIdentity(sides[0]!, sides[1]!);
      if (id) return id.valid ? "Đẳng thức ĐÚNG với mọi giá trị của biến (kiểm tra chính xác)." : "Đẳng thức SAI.";
      const vars = [...new Set([...variablesOf(sides[0]!), ...variablesOf(sides[1]!)])];
      if (!vars.length) {
        const l = evalExpression(sides[0]!), r = evalExpression(sides[1]!);
        return Math.abs(l - r) <= 1e-9 * Math.max(1, Math.abs(l)) ? `ĐÚNG: hai vế bằng ${+l.toFixed(10)}.` : `SAI: vế trái = ${+l.toFixed(10)}, vế phải = ${+r.toFixed(10)}.`;
      }
      const samples = [0.37, 1.7, 2.25, 4, 7.3, 9];
      for (const x of samples) {
        const env = Object.fromEntries(vars.map((v, i) => [v, x + i * 0.61]));
        const l = evalExpression(sides[0]!, env), r = evalExpression(sides[1]!, env);
        if (Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) > 1e-7 * Math.max(1, Math.abs(l))) return `SAI tại ${JSON.stringify(env)}: vế trái = ${+l.toFixed(8)}, vế phải = ${+r.toFixed(8)}.`;
      }
      return `Hai vế bằng nhau tại ${samples.length} bộ giá trị dương của ${vars.join(", ")} (kiểm tra số, không phải chứng minh).`;
    }
    return `${e} = ${+evalExpression(e).toFixed(12)}`;
  } catch (err) {
    return `Không tính được: ${(err as Error).message.slice(0, 120)}`;
  }
}

/** The machine solver of the statement-like task (equations, systems, extrema, integer solutions…). */
function machineSolve(task: string): string {
  const results = computeAnswers(task.normalize("NFC"), 2500);
  return results.length ? results.map(({ part, result }) => `${part ? `Câu ${part}: ` : ""}${result.summary}`).join("\n") : "Máy không giải được dạng này; tự lập luận và kiểm tra bằng evaluate.";
}

// ---------------------------------------------------------------- number theory

function factorize(n: bigint): string {
  if (n === 0n) return "0";
  let m = n < 0n ? -n : n;
  const f: [bigint, number][] = [];
  for (let p = 2n; p * p <= m && p < 10_000_000n; p++) {
    let e = 0;
    while (m % p === 0n) { m /= p; e++; }
    if (e) f.push([p, e]);
  }
  if (m > 1n) f.push([m, 1]);
  return f.map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join(" · ");
}
function divisors(n: bigint): bigint[] {
  const m = n < 0n ? -n : n, out: bigint[] = [];
  for (let d = 1n; d * d <= m && d < 1_000_000n; d++) if (m % d === 0n) { out.push(d); if (d * d !== m) out.push(m / d); }
  return out.sort((a, b) => (a < b ? -1 : 1));
}
const gcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };

function numberFacts(numbers: string[]): string {
  try {
    const ns = numbers.map((x) => BigInt(x.trim()));
    if (!ns.length) return "Cần ít nhất một số nguyên.";
    const lines = ns.map((n) => `${n} = ${factorize(n)}; ước dương: ${divisors(n).slice(0, 60).join(", ")}${divisors(n).length > 60 ? " …" : ""}`);
    if (ns.length > 1) {
      const g = ns.reduce(gcd), l = ns.reduce((a, b) => (a / gcd(a, b)) * b);
      lines.push(`ƯCLN = ${g}, BCNN = ${l < 0n ? -l : l}`);
    }
    return lines.join("\n");
  } catch {
    return "Chỉ nhận số nguyên.";
  }
}

/** All integer tuples in a box satisfying the condition (relations joined by "and"/"or"; % is the remainder). */
function integerSearch(condition: string, variables: string[], min: number, max: number): string {
  const vars = variables.slice(0, 3);
  if (!vars.length) return "Cần tên biến.";
  const lo = Math.max(-2000, Math.floor(min)), hi = Math.min(2000, Math.ceil(max));
  const size = (hi - lo + 1) ** vars.length;
  if (size > 2_000_000) return "Miền quá lớn: thu hẹp min/max (tối đa 2 000 000 bộ).";
  const found: number[][] = [];
  const env: Record<string, number> = {};
  const loop = (i: number): void => {
    if (found.length > 60) return;
    if (i === vars.length) {
      let ok: boolean | null = null;
      try { ok = evalCondition(condition, env); } catch { ok = null; }
      if (ok) found.push(vars.map((v) => env[v]!));
      return;
    }
    for (let x = lo; x <= hi; x++) { env[vars[i]!] = x; loop(i + 1); }
  };
  loop(0);
  if (found.length > 60) return `Có hơn 60 nghiệm trong miền [${lo}; ${hi}] (có thể vô số): ${found.slice(0, 20).map((t) => `(${t.join("; ")})`).join(", ")} …`;
  return `Tìm vét cạn ${vars.join(", ")} ∈ [${lo}; ${hi}] (không thay cho chứng minh): ${found.length ? found.map((t) => `(${t.join("; ")})`).join(", ") : "không có nghiệm"}.`;
}

// ---------------------------------------------------------------- combinatorics

const FACT: bigint[] = [1n];
const fact = (n: number) => { for (let i = FACT.length; i <= n; i++) FACT.push(FACT[i - 1]! * BigInt(i)); return FACT[n]!; };
function counting(kind: string, n: number, k: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || n > 200) return "n, k phải là số nguyên, 0 ≤ k, n ≤ 200.";
  if (kind === "factorial") return `${n}! = ${fact(n)}`;
  if (k > n) return `k > n: kết quả bằng 0.`;
  if (kind === "combination") return `C(${n}, ${k}) = ${fact(n) / (fact(k) * fact(n - k))}`;
  if (kind === "arrangement") return `A(${n}, ${k}) = ${fact(n) / fact(n - k)}`;
  return "kind phải là factorial, combination hoặc arrangement.";
}

/**
 * Counts sequences a1…ak taken from `items` (ordered or as sets, with or without repetition) that satisfy the condition
 * (relations on a1…ak and s = a1+…+ak, joined by "and"/"or"; % is the remainder).
 */
function enumerateCount(items: number[], length: number, ordered: boolean, repetition: boolean, condition: string): string {
  if (length < 1 || length > 8 || items.length > 30) return "length 1–8, tối đa 30 phần tử.";
  const total = repetition ? items.length ** length : 0;
  if (repetition && total > 3_000_000) return "Quá nhiều trường hợp để liệt kê.";
  let count = 0;
  const examples: number[][] = [];
  const seq: number[] = [];
  const used = new Array(items.length).fill(false);
  const visit = (start: number) => {
    if (seq.length === length) {
      const env: Record<string, number> = { s: seq.reduce((a, b) => a + b, 0) };
      seq.forEach((v, i) => (env[`a${i + 1}`] = v));
      let ok: boolean | null = true;
      if (condition.trim()) { try { ok = evalCondition(condition, env); } catch { ok = null; } }
      if (ok) { count++; if (examples.length < 5) examples.push([...seq]); }
      return;
    }
    for (let i = ordered ? 0 : start; i < items.length; i++) {
      if (!repetition && used[i]) continue;
      used[i] = true; seq.push(items[i]!);
      visit(repetition ? i : i + 1);
      seq.pop(); used[i] = false;
    }
  };
  visit(0);
  return `Liệt kê đầy đủ: ${count} ${ordered ? "dãy" : "tập"} thỏa mãn (ví dụ: ${examples.map((e) => `(${e.join(", ")})`).join(", ") || "không có"}). Lời giải vẫn phải đếm bằng quy tắc cộng/nhân.`;
}

function takeAway(stones: number, moves: number[], lastLoses: boolean): string {
  if (!Number.isInteger(stones) || stones < 1 || stones > 2000 || !moves.length) return "Cần số viên (1–2000) và danh sách số viên được lấy.";
  const c = solveTakeAway({ stones, moves: [...new Set(moves)].sort((a, b) => a - b), lastLoses });
  const losing = c.winning.map((w, i) => (w ? null : i)).filter((x): x is number => x !== null).slice(0, 30);
  return `${c.winning[stones] ? "Người đi trước" : "Người đi sau"} có chiến lược thắng. Các trạng thái thua (người phải đi thua): ${losing.join(", ")}${losing.length === 30 ? " …" : ""}. ${c.winning[stones] ? `Nước đầu: lấy ${c.move[stones]} viên.` : ""}`;
}

// ---------------------------------------------------------------- geometry board

/** The figure the agent builds step by step: points, lines (segments, rays), polygons, circles; measured on demand. */
export class GeometryBoard {
  figure: Figure = { scale: "schematic", points: [], lines: [], circles: [], angles: [], marks: [], checks: [] };
  fromStatement(text: string): string {
    const built = figureFromStatement(text)?.figure;
    if (!built) return "Không dựng được hình từ đề bài: dựng từng điểm bằng add_point.";
    this.figure = { ...built, checks: [] };
    return `Đã dựng hình từ đề bài.\n${this.summary()}`;
  }
  private resolve() {
    return resolveFigure(FigureSchema.parse(this.figure));
  }
  summary(): string {
    const r = this.resolve();
    const pts = Object.entries(r.points).map(([id, p]) => `${id}(${p.x.toFixed(2)}; ${p.y.toFixed(2)})`).join(", ");
    return [`Điểm: ${pts || "chưa có"}`, `Đoạn/đường: ${this.figure.lines.map((l) => `${l.kind} ${l.from}${l.to}`).join(", ") || "chưa có"}`, `Đường tròn: ${this.figure.circles.map((c) => `${c.id} tâm ${c.center}${c.through ? ` qua ${c.through}` : ` bán kính ${c.radius}`}`).join(", ") || "chưa có"}`, ...(r.errors.length ? [`Lỗi: ${r.errors.slice(0, 4).join("; ")}`] : [])].join("\n");
  }
  addPoint(p: { id: string; kind: string; refs: string[]; x: number | null; y: number | null; value: number | null; value2: number | null }): string {
    const kind = PointKindSchema.safeParse(p.kind);
    if (!kind.success) return `kind không hợp lệ; dùng một trong: ${PointKindSchema.options.join(", ")}.`;
    const def: PointDef = { id: p.id, label: p.id, kind: kind.data, refs: p.refs, x: p.x, y: p.y, value: p.value, value2: p.value2, draggable: kind.data === "free", hidden: false };
    this.figure.points = [...this.figure.points.filter((q) => q.id !== p.id), def];
    const r = this.resolve();
    const at = r.points[p.id];
    return at ? `Điểm ${p.id} = (${at.x.toFixed(3)}; ${at.y.toFixed(3)}).` : `Không dựng được ${p.id}: ${r.errors.filter((e) => e.includes(p.id)).slice(0, 2).join("; ") || "kiểm tra refs"}.`;
  }
  addLine(from: string, to: string, kind: "segment" | "line" | "ray", given: boolean): string {
    const id = `${kind === "segment" ? "seg" : kind}_${from}${to}`;
    this.figure.lines = [...this.figure.lines.filter((l) => l.id !== id), { id, kind, from, to, style: given ? "given" : "construction", label: null }];
    return `Đã thêm ${kind} ${from}${to} (id ${id}).`;
  }
  addPolygon(vertices: string[], given: boolean): string {
    if (vertices.length < 3) return "Đa giác cần ít nhất 3 đỉnh.";
    vertices.forEach((v, i) => this.addLine(v, vertices[(i + 1) % vertices.length]!, "segment", given));
    return `Đã thêm đa giác ${vertices.join("")}.`;
  }
  addCircle(id: string, center: string, through: string | null, radius: number | null, given: boolean): string {
    this.figure.circles = [...this.figure.circles.filter((c) => c.id !== id), { id, center, through, radius, style: given ? "given" : "construction", label: `(${center})` }];
    const r = this.resolve();
    return r.circles?.[id] ? `Đã thêm đường tròn ${id}.` : `Đường tròn ${id}: ${r.errors.slice(-1)[0] ?? "kiểm tra tâm/điểm"}.`;
  }
  check(kind: string, refs: string[], value: number | null, role: "given" | "derived" = "derived"): string {
    const c = FigureCheckSchema.safeParse({ kind, refs, value, role });
    if (!c.success) return `Thuộc tính không hợp lệ (${c.error.issues[0]?.message}); kind: ${FigureCheckSchema.shape.kind.options.join(", ")}.`;
    this.figure.checks = [...this.figure.checks.filter((x) => x.kind !== c.data.kind || x.refs.join("|") !== c.data.refs.join("|")), c.data].slice(-16);
    const r = evaluateFigureCheck(c.data, this.resolve());
    return `${kind} ${refs.join(",")}: ${r.passed ? "ĐÚNG trên hình" : "SAI trên hình"} (${r.detail}). Đo trên hình chỉ là kiểm tra, lời giải vẫn phải chứng minh.`;
  }

  /** Adds a complete construction from structured lists, then resolves and checks it as one tool call. */
  build(input: {
    points?: { id: string; kind: string; refs: string[]; x: number | null; y: number | null; value: number | null; value2: number | null }[];
    lines?: { from: string; to: string; kind: "segment" | "line" | "ray"; given: boolean }[];
    polygons?: { vertices: string[]; given: boolean }[];
    circles?: { id: string; center: string; through: string | null; radius: number | null; given: boolean }[];
    properties?: { kind: string; refs: string[]; value: number | null; role: "given" | "derived" }[];
  }): string {
    const results: string[] = [];
    for (const p of input.points ?? []) results.push(this.addPoint(p));
    for (const l of input.lines ?? []) results.push(this.addLine(l.from, l.to, l.kind, l.given));
    for (const p of input.polygons ?? []) results.push(this.addPolygon(p.vertices, p.given));
    for (const c of input.circles ?? []) results.push(this.addCircle(c.id, c.center, c.through, c.radius, c.given));
    for (const p of input.properties ?? []) results.push(this.check(p.kind, p.refs, p.value, p.role));
    return `${results.join("\n")}\n${this.summary()}`.trim();
  }
}

// ---------------------------------------------------------------- tool sets

export function toolsFor(type: ProblemType): ToolDef[] {
  const common: ToolDef[] = [];
  if (type === "algebra") common.push(
    fn("evaluate", "Tính giá trị biểu thức số, hoặc kiểm tra một đẳng thức 'A = B' (chính xác với đa thức/phân thức, hoặc thử nhiều giá trị dương).", { expression: str }),
    fn("machine_solve", "Máy giải một bài con viết bằng tiếng Việt có công thức trong $…$: giải phương trình/hệ, tìm GTLN/GTNN, tìm m… Trả về kết quả số để đối chiếu.", { task: str }),
    fn("check_simplification", "So sánh biểu thức ban đầu với dạng rút gọn tại nhiều giá trị của biến.", { original: str, simplified: str }),
  );
  if (type === "number_theory") common.push(
    fn("modulo", "Số dư chính xác của một biểu thức số nguyên (lũy thừa rất lớn được) khi chia cho m.", { expression: str, modulus: int }),
    fn("integer_search", "Tìm vét cạn mọi bộ số nguyên trong [min; max] thỏa điều kiện (quan hệ nối bằng and/or; % là phép lấy dư), ví dụ 'x^2 - y^2 = 24 and x > 0 and y > 0' hoặc '(n^2+3n+5) % (n+1) = 0'.", { condition: str, variables: { type: "array", items: str }, min: int, max: int }),
    fn("number_facts", "Phân tích thừa số nguyên tố, các ước dương, ƯCLN và BCNN của các số nguyên.", { numbers: { type: "array", items: str } }),
  );
  if (type === "combinatorics") common.push(
    fn("counting_formula", "Tính chính xác n!, tổ hợp C(n,k) hoặc chỉnh hợp A(n,k).", { kind: { type: "string", enum: ["factorial", "combination", "arrangement"] }, n: int, k: int }),
    fn("enumerate_count", "Liệt kê đầy đủ các dãy a1…ak lấy từ items (có thứ tự hay không, có lặp hay không) thỏa điều kiện trên a1…ak và s = tổng (ví dụ 'a1 != 0 and a3 % 2 = 0'). Dùng để kiểm tra đáp số đếm.", { items: { type: "array", items: num }, length: int, ordered: { type: "boolean" }, repetition: { type: "boolean" }, condition: str }),
    fn("take_away_game", "Phân tích trò chơi bốc sỏi: số viên, các số viên được bốc mỗi lượt, người bốc viên cuối thua hay thắng.", { stones: int, moves: { type: "array", items: int }, last_loses: { type: "boolean" } }),
  );
  if (type === "geometry") common.push(
    fn("figure_from_statement", "Dựng hình tự động từ đề bài (nên gọi đầu tiên). Trả về các điểm, đường, đường tròn đã dựng.", {}),
    fn("build_figure", `Dựng hoặc bổ sung hình trong một lần gọi bằng năm danh sách: points, lines, polygons, circles, properties. Điểm hỗ trợ free, polar, midpoint, on_segment, foot, intersection, line_circle, circle_circle, on_circle, tangent, reflect, rotate, translate, centroid, circumcenter, incenter, orthocenter. Thuộc tính hỗ trợ ${FigureCheckSchema.shape.kind.options.join(", ")}.`, {
      points: { type: "array", items: { type: "object", properties: { id: str, kind: { type: "string", enum: PointKindSchema.options }, refs: { type: "array", items: str }, x: nullableNum, y: nullableNum, value: nullableNum, value2: nullableNum }, required: ["id", "kind", "refs", "x", "y", "value", "value2"], additionalProperties: false } },
      lines: { type: "array", items: { type: "object", properties: { from: str, to: str, kind: { type: "string", enum: ["segment", "line", "ray"] }, given: { type: "boolean" } }, required: ["from", "to", "kind", "given"], additionalProperties: false } },
      polygons: { type: "array", items: { type: "object", properties: { vertices: { type: "array", items: str }, given: { type: "boolean" } }, required: ["vertices", "given"], additionalProperties: false } },
      circles: { type: "array", items: { type: "object", properties: { id: str, center: str, through: { type: ["string", "null"] }, radius: nullableNum, given: { type: "boolean" } }, required: ["id", "center", "through", "radius", "given"], additionalProperties: false } },
      properties: { type: "array", items: { type: "object", properties: { kind: { type: "string", enum: FigureCheckSchema.shape.kind.options }, refs: { type: "array", items: str }, value: nullableNum, role: { type: "string", enum: ["given", "derived"] } }, required: ["kind", "refs", "value", "role"], additionalProperties: false } },
    }),
    fn("check_property", `Đo một tính chất trên hình: ${FigureCheckSchema.shape.kind.options.join(", ")} (refs theo thứ tự điểm, ví dụ collinear [A,G,D], perpendicular [A,B,C,D] là AB ⊥ CD, angle_value [A,V,B] value độ, concyclic [A,B,C,D], on_circle [P, circleId]).`, { kind: { type: "string", enum: FigureCheckSchema.shape.kind.options }, refs: { type: "array", items: str }, value: nullableNum }),
  );
  return common;
}

/** Runs one type tool; null when the name is not a type tool. */
export function runTypeTool(name: string, args: Record<string, unknown>, ctx: { board: GeometryBoard; problemText: string }): string | null {
  const s = (k: string) => String(args[k] ?? ""), n = (k: string) => Number(args[k]), b = (k: string) => args[k] === true;
  const nullable = (k: string) => (typeof args[k] === "number" ? (args[k] as number) : null);
  switch (name) {
    case "evaluate": return evaluate(s("expression"));
    case "machine_solve": return machineSolve(s("task"));
    case "check_simplification": return evaluate(`${s("original")} = ${s("simplified")}`);
    case "modulo": { const m = n("modulus"); if (!Number.isInteger(m) || m < 2) return "modulus ≥ 2."; const r = expressionMod(s("expression"), BigInt(m)); return r === null ? "Chỉ nhận biểu thức số nguyên (+ - * ^ và ngoặc)." : `${s("expression")} chia ${m} dư ${r}.`; }
    case "integer_search": return integerSearch(s("condition"), (args.variables as string[]) ?? [], n("min"), n("max"));
    case "number_facts": return numberFacts(((args.numbers as unknown[]) ?? []).map(String));
    case "counting_formula": return counting(s("kind"), n("n"), n("k"));
    case "enumerate_count": return enumerateCount(((args.items as unknown[]) ?? []).map(Number), n("length"), b("ordered"), b("repetition"), s("condition"));
    case "take_away_game": return takeAway(n("stones"), ((args.moves as unknown[]) ?? []).map(Number), b("last_loses"));
    case "figure_from_statement": return ctx.board.fromStatement(ctx.problemText);
    case "build_figure": return ctx.board.build(args as Parameters<GeometryBoard["build"]>[0]);
    case "add_point": return ctx.board.addPoint({ id: s("id"), kind: s("kind"), refs: ((args.refs as unknown[]) ?? []).map(String), x: nullable("x"), y: nullable("y"), value: nullable("value"), value2: nullable("value2") });
    case "add_line": return ctx.board.addLine(s("from"), s("to"), (s("kind") || "segment") as "segment" | "line" | "ray", b("given"));
    case "add_polygon": return ctx.board.addPolygon(((args.vertices as unknown[]) ?? []).map(String), b("given"));
    case "add_circle": return ctx.board.addCircle(s("id"), s("center"), typeof args.through === "string" ? args.through : null, nullable("radius"), b("given"));
    case "check_property": return ctx.board.check(s("kind"), ((args.refs as unknown[]) ?? []).map(String), nullable("value"));
    default: return null;
  }
}
