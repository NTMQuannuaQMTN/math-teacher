/**
 * Builds points straight from their definitions in the problem and solution text.
 *
 * "Gọi M là trung điểm của BC", "H là giao điểm khác I của IK với đường tròn
 * đường kính AI", "(I) tiếp xúc với BC, CA, AB lần lượt tại D, E, F"… A
 * definition like this fixes the point exactly, so it doesn't have to be left
 * to the model — which on hard problems forgets points or drops them at an
 * arbitrary spot. Parsed definitions:
 *   - add points the figure lacks, and
 *   - replace points the model merely *placed* (free / on_segment / on_circle /
 *     polar) where the text defines them exactly.
 * Circles the definitions need ("đường tròn đường kính AI", "đường tròn ngoại
 * tiếp tam giác ABC") are created with hidden centers. Anything that can't be
 * constructed is pruned later by verification, so a misparse can't break a figure.
 */
import type { CircleDef, Figure, ModelLesson, PointDef } from "./solution";

const PT = "[A-Z]'*";
const PLACED = new Set<PointDef["kind"]>(["free", "on_segment", "on_circle", "polar"]);

type Ref = { line: [string, string] } | { circle: string };

function clean(text: string): string {
  return text
    .replace(/\$/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ");
}

class Builder {
  readonly points: PointDef[];
  readonly circles: CircleDef[];
  readonly changed: string[] = [];

  constructor(figure: Figure) {
    this.points = figure.points.map((p) => ({ ...p }));
    this.circles = figure.circles.map((c) => ({ ...c }));
  }

  has(id: string) {
    return this.points.some((p) => p.id === id);
  }

  private uniqueId(base: string) {
    const taken = new Set([...this.points.map((p) => p.id), ...this.circles.map((c) => c.id)]);
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
    return id;
  }

  /** Adds `name`, or replaces it when the model only placed it; never touches a constructed point. */
  define(name: string, kind: PointDef["kind"], refs: string[], value: number | null = null): void {
    const refOk = (r: string) => this.has(r) || this.circles.some((c) => c.id === r);
    if (!refs.every(refOk) || refs.includes(name)) return;
    const existing = this.points.find((p) => p.id === name);
    const def: PointDef = { id: name, label: name, kind, refs, x: null, y: null, value, value2: null, draggable: false, hidden: false };
    if (!existing) {
      this.points.push(def);
      this.changed.push(name);
    } else if (PLACED.has(existing.kind) && !(existing.kind === kind && existing.refs.join() === refs.join())) {
      // A defining point can't be placed arbitrarily; free vertices ("Cho tam giác ABC") never get a definition here.
      Object.assign(existing, { ...def, label: existing.label, hidden: existing.hidden });
      this.changed.push(name);
    }
  }

  private helper(base: string, kind: PointDef["kind"], refs: string[]): string {
    const existing = this.points.find((p) => p.kind === kind && p.refs.join() === refs.join());
    if (existing) return existing.id;
    const id = this.uniqueId(base);
    this.points.push({ id, label: "", kind, refs, x: null, y: null, value: null, value2: null, draggable: false, hidden: true });
    return id;
  }

  private circleThrough(center: string, through: string, base: string): string {
    const existing = this.circles.find((c) => c.center === center);
    if (existing) return existing.id;
    const id = this.uniqueId(base);
    this.circles.push({ id, center, through, radius: null, style: "given", label: null });
    return id;
  }

  /** Makes circle `name` the circle through three points (hidden circumcenter), creating or correcting it. */
  namedCircleThrough(name: string, through: [string, string, string]): void {
    if (!through.every((x) => this.has(x)) || this.has(name)) return;
    const o = this.helper(`O_${through.join("")}`, "circumcenter", through);
    const existing = this.circles.find((c) => c.id === name || c.id === `c_${name}` || (c.label ?? "").includes(`(${name})`));
    if (existing) {
      existing.center = o;
      existing.through = through[0];
      existing.radius = null;
    } else {
      this.circles.push({ id: this.uniqueId(`c_${name}`), center: o, through: through[0], radius: null, style: "given", label: `(${name})` });
    }
    this.changed.push(`(${name})`);
  }

  /** Hidden foot of the perpendicular from p to line xy (a point on the incircle for its radius). */
  hiddenFoot(p: string, x: string, y: string): string {
    return this.helper(`T_${p}${x}${y}`, "foot", [p, x, y]);
  }

  /** Makes sure a circle centered at `center` exists (labelled), passing through `through`. */
  circleWithCenter(center: string, through: string, label: string): void {
    const existing = this.circles.find((c) => c.center === center);
    if (existing) {
      if (!existing.label) existing.label = label;
      return;
    }
    const id = this.uniqueId(`c_${center}`);
    this.circles.push({ id, center, through, radius: null, style: "given", label });
    this.changed.push(label);
  }

  /** "(O)", "đường tròn (O)", "đường tròn đường kính AI", "đường tròn ngoại tiếp tam giác ABC". */
  circleRef(phrase: string): string | null {
    const p = phrase.trim();
    let m = new RegExp(`^(?:đường tròn\\s*)?\\(\\s*(${PT})\\s*(?:[;,][^)]*)?\\)`).exec(p) ?? new RegExp(`^(?:đường tròn|circle)\\s+(${PT})$`).exec(p);
    if (m) {
      const name = m[1]!;
      const c = this.circles.find((c) => c.id === name || c.id === `c_${name}` || (c.label ?? "").includes(`(${name})`) || (c.label ?? "") === name) ?? this.circles.find((c) => c.center === name);
      return c?.id ?? null;
    }
    m = new RegExp(`^(?:đường tròn\\s+)?đường kính\\s+(${PT})(${PT})|^(?:the\\s+)?circle with diameter\\s+(${PT})(${PT})`).exec(p);
    if (m) {
      const [a, b] = [m[1] ?? m[3]!, m[2] ?? m[4]!];
      if (!this.has(a) || !this.has(b)) return null;
      const mid = this.helper(`M_${a}${b}`, "midpoint", [a, b]);
      return this.circleThrough(mid, a, `c_d${a}${b}`);
    }
    m = new RegExp(`^(?:đường tròn\\s+)?(?:ngoại tiếp|đi qua|qua)\\s+(?:tam giác\\s+|ba điểm\\s+)?(${PT})\\s*,?\\s*(${PT})\\s*,?\\s*(?:và\\s+)?(${PT})`).exec(p);
    if (m) {
      const [a, b, c] = [m[1]!, m[2]!, m[3]!];
      if (![a, b, c].every((x) => this.has(x))) return null;
      const o = this.helper(`O_${a}${b}${c}`, "circumcenter", [a, b, c]);
      return this.circleThrough(o, a, `c_${a}${b}${c}`);
    }
    return null;
  }

  ref(phrase: string): Ref | null {
    const p = phrase
      .trim()
      .replace(/^(?:hai\s+|các\s+)?(?:đường chéo|đường thẳng|đoạn thẳng|đoạn|tia|cạnh|line|segment|ray)\s+/i, "")
      .trim();
    if (/đường tròn|\(|circle/.test(p)) {
      const c = this.circleRef(p);
      return c ? { circle: c } : null;
    }
    const m = new RegExp(`^(${PT})(${PT})$`).exec(p);
    return m && this.has(m[1]!) && this.has(m[2]!) ? { line: [m[1]!, m[2]!] } : null;
  }

  /** The intersection of two objects, "other than" `avoid` when given. */
  intersect(name: string, a: Ref, b: Ref, avoid?: string): void {
    if ("line" in a && "line" in b) return this.define(name, "intersection", [...a.line, ...b.line]);
    if ("circle" in a && "circle" in b) return this.define(name, "circle_circle", avoid ? [a.circle, b.circle, avoid] : [a.circle, b.circle], avoid ? null : 0);
    const line = "line" in a ? a.line : (b as { line: [string, string] }).line;
    const circle = "circle" in a ? a.circle : (b as { circle: string }).circle;
    // line_circle picks the hit nearer (0) / farther (1) from refs[0]: start the line at the excluded point.
    const [p, q] = avoid && line[1] === avoid ? [line[1], line[0]] : line;
    this.define(name, "line_circle", [p, q, circle], 1);
  }
}

const INTERSECTION = /^(?:các\s+|là\s+)?(?:giao điểm|intersection(?: point)?)(?:\s+thứ hai)?(?:\s+(?:khác|other than)\s+([A-Z]'*))?(?:\s+(?:của|of))?\s+/;

function definePhrase(b: Builder, name: string, phrase: string): void {
  let m: RegExpExecArray | null;
  const p = phrase.trim();
  if ((m = new RegExp(`^(?:điểm\\s+)?(?:trung điểm|the midpoint)(?:\\s+(?:của|of))?\\s+(?:cạnh\\s+|đoạn(?: thẳng)?\\s+|segment\\s+)?(${PT})(${PT})\\b`).exec(p))) {
    return b.define(name, "midpoint", [m[1]!, m[2]!]);
  }
  if (
    (m = new RegExp(
      `^(?:chân đường (?:cao|vuông góc)(?:\\s+(?:kẻ|hạ))?\\s+từ|hình chiếu(?: vuông góc)?\\s+của|the foot of the (?:altitude|perpendicular) from|the projection of)\\s+(${PT})\\s+(?:xuống|trên|lên|đến|tới|to|onto|on)\\s+(?:cạnh\\s+|đường thẳng\\s+|đoạn(?: thẳng)?\\s+|line\\s+)?(${PT})(${PT})\\b`,
    ).exec(p))
  ) {
    return b.define(name, "foot", [m[1]!, m[2]!, m[3]!]);
  }
  if ((m = new RegExp(`^tâm(?:\\s+của)?\\s+đường tròn\\s+(ngoại|nội)\\s+tiếp\\s+(?:tam giác\\s+)?(${PT})(${PT})(${PT})\\b`).exec(p))) {
    return b.define(name, m[1] === "ngoại" ? "circumcenter" : "incenter", [m[2]!, m[3]!, m[4]!]);
  }
  if ((m = new RegExp(`^(trọng tâm|trực tâm)(?:\\s+của)?\\s+(?:tam giác\\s+)?(${PT})(${PT})(${PT})\\b`).exec(p))) {
    return b.define(name, m[1] === "trọng tâm" ? "centroid" : "orthocenter", [m[2]!, m[3]!, m[4]!]);
  }
  if ((m = new RegExp(`^(?:điểm\\s+)?đối xứng(?:\\s+(?:của|với))?\\s+(${PT})\\s+qua\\s+(?:đường thẳng\\s+(${PT})(${PT})|(?:điểm\\s+)?(${PT})\\b)`).exec(p))) {
    return m[2] ? b.define(name, "reflect", [m[1]!, m[2]!, m[3]!]) : b.define(name, "reflect", [m[1]!, m[4]!]);
  }
  if ((m = INTERSECTION.exec(p))) {
    let avoid = m[1];
    let rest = p.slice(m[0].length);
    // "… với (O) khác A" — the excluded point can also come last.
    const trailing = new RegExp(`\\s+(?:khác|other than)\\s+(${PT})\\s*$`).exec(rest);
    if (trailing) {
      avoid ??= trailing[1];
      rest = rest.slice(0, trailing.index);
    }
    const parts = /^(.+?)\s+(?:với|và|and|with)\s+(.+)$/.exec(rest);
    if (!parts) return;
    const a = b.ref(parts[1]!);
    const c = b.ref(parts[2]!.replace(/\s*(?:tại|at)\s.*$/, ""));
    if (a && c) b.intersect(name, a, c, avoid);
  }
}

/** "L và G lần lượt là các giao điểm khác D của DJ và (S) với (I)" → L = DJ ∩ (I), G = (S) ∩ (I). */
function defineRespectively(b: Builder, names: string[], phrase: string): void {
  const m = INTERSECTION.exec(phrase.trim());
  if (!m) return;
  const rest = phrase.trim().slice(m[0].length);
  const parts = /^(.+?)\s+và\s+(.+?)\s+với\s+(.+)$/.exec(rest);
  if (!parts || names.length !== 2) return;
  const common = b.ref(parts[3]!);
  const first = b.ref(parts[1]!);
  const second = b.ref(parts[2]!);
  if (common && first) b.intersect(names[0]!, first, common, m[1]);
  if (common && second) b.intersect(names[1]!, second, common, m[1]);
}

/** "(I) tiếp xúc với (các cạnh) BC, CA, AB lần lượt tại D, E, F" / "tiếp xúc với BC tại D" → feet from the center. */
function defineTangency(b: Builder, text: string): void {
  const re = new RegExp(
    `\\(\\s*(${PT})\\s*\\)\\s+tiếp xúc với\\s+(?:các cạnh\\s+|cạnh\\s+|các đường thẳng\\s+|đường thẳng\\s+)?((?:${PT}${PT}\\s*,\\s*)*(?:${PT}${PT}))(?:\\s+lần lượt)?\\s+tại\\s+((?:${PT}\\s*,\\s*)*(?:và\\s+)?${PT})`,
    "g",
  );
  for (const m of text.matchAll(re)) {
    const circle = b.circleRef(`(${m[1]})`);
    const center = circle ? b.circles.find((c) => c.id === circle)!.center : m[1]!;
    const sides = m[2]!.split(/\s*,\s*/);
    const touch = m[3]!.replace(/\s+và\s+/, ", ").split(/\s*,\s*/);
    if (sides.length !== touch.length) continue;
    sides.forEach((side, i) => {
      const [x, y] = side.match(/[A-Z]'*/g)!;
      b.define(touch[i]!, "foot", [center, x!, y!]);
    });
  }
}

/**
 * "tam giác ABC … có đường tròn nội tiếp (I)" → I = incenter(A, B, C), circle (I) tangent to BC;
 * "… đường tròn ngoại tiếp (O)" → O = circumcenter(A, B, C), circle (O) through A.
 */
function defineTriangleCircles(b: Builder, text: string): void {
  const re = new RegExp(`tam giác\\s+(${PT})(${PT})(${PT})[^.;]{0,80}?đường tròn\\s+(nội|ngoại)\\s+tiếp(?:\\s+tam giác\\s+${PT}${PT}${PT})?\\s*\\(\\s*(${PT})\\s*\\)`, "giu");
  for (const m of text.matchAll(re)) {
    const [a, bb, c, kind, center] = [m[1]!, m[2]!, m[3]!, m[4]!.toLowerCase(), m[5]!];
    if (![a, bb, c].every((x) => b.has(x))) continue;
    b.define(center, kind === "nội" ? "incenter" : "circumcenter", [a, bb, c]);
    if (!b.has(center)) continue;
    b.circleWithCenter(center, kind === "nội" ? b.hiddenFoot(center, bb, c) : a, `(${center})`);
  }
}

/** "I, D, J, H cùng thuộc một đường tròn (S)" → (S) is the circle through the first three (its definition wins). */
function defineNamedCircles(b: Builder, text: string): void {
  const re = new RegExp(
    `(${PT})\\s*,\\s*(${PT})\\s*,\\s*(${PT})(?:\\s*,\\s*(?:và\\s+)?${PT})*\\s+(?:cùng thuộc|cùng nằm trên|thuộc)\\s+(?:một\\s+)?đường tròn\\s*\\(\\s*(${PT})\\s*\\)`,
    "g",
  );
  for (const m of text.matchAll(re)) b.namedCircleThrough(m[4]!, [m[1]!, m[2]!, m[3]!]);
}

export function constructNamedPoints(lesson: ModelLesson): { lesson: ModelLesson; constructed: string[] } {
  if (!lesson.figure) return { lesson, constructed: [] };
  const b = new Builder(lesson.figure);
  const texts = [lesson.analysis.statement, ...lesson.steps.flatMap((s) => [s.title, s.explanation]), ...lesson.hints.map((h) => h.explanation)]
    .filter((t): t is string => !!t)
    .map(clean);

  // Two passes: a definition may use a point defined later in the text.
  for (let pass = 0; pass < 2; pass++) {
    for (const text of texts) {
      defineTriangleCircles(b, text);
      defineTangency(b, text);
      defineNamedCircles(b, text);
      for (const sentence of text.split(/[.;]\s|\n/)) {
        const resp = new RegExp(`(${PT})\\s*(?:,|và)\\s*(${PT})\\s+lần lượt là\\s+(.+)$`).exec(sentence);
        if (resp) defineRespectively(b, [resp[1]!, resp[2]!], resp[3]!);
        // A phrase ends where the next definition starts (", H là …" / " và K là …").
        const nextDefinition = `(?:,\\s*|\\s+(?:và|and)\\s+)${PT}\\s+(?:là|is)\\s`;
        for (const m of sentence.matchAll(new RegExp(`(?:^|[\\s,(])(${PT})\\s+(?:là|is)\\s+((?:(?!${nextDefinition}).)+)`, "g"))) {
          definePhrase(b, m[1]!, m[2]!.replace(/^(?:the|a|an|điểm)\s+/, ""));
        }
      }
    }
  }
  if (b.changed.length === 0) return { lesson, constructed: [] };
  return { lesson: { ...lesson, figure: { ...lesson.figure, points: b.points, circles: b.circles.slice(0, 6) } }, constructed: [...new Set(b.changed)] };
}
