/**
 * Independent proof verifier. Shares no code with the search (engine.ts `search`/`tryProve`): it receives a proof
 * as a list of steps (fact, method, premises) and re-checks each one from scratch.
 *
 *   1. the method exists in the library, is allowed, and is within the grade-9 curriculum
 *   2. premises are earlier steps (no forward or circular references)
 *   3. givens: the fact is produced by the statement's construction / shape words (recomputed here)
 *   4. rules: the premises have exactly the shape the method needs, and the conclusion is what it gives
 *   5. algebra (angle chase, length algebra): re-solved with a fresh linear system holding only the cited premises
 *   6. numeric sanity: every fact holds on the figure AND on randomly perturbed copies of it (same construction,
 *      moved free points) — a fact true only in this particular drawing is rejected
 *
 * Numerical configurations are sanity checks, not proofs of point order. Undirected angle chases
 * involving unrestricted line intersections are rejected until the proof system represents
 * explicit order deductions or exhaustive positional cases. Other configuration-dependent
 * methods still require care; perturbing a drawing is not universal certification.
 */
import { resolveFigure } from "../geometry";
import type { Figure } from "../solution";
import { constructionFacts, Oracle, type Derivation } from "./engine";
import { angleEquations, factKey, factPoints, lengthEquations, type Fact, type Seg, type Tri } from "./facts";
import { LinearSystem } from "./linear";
import { method } from "./methods";

export interface StepCheck {
  id: number;
  ok: boolean;
  problems: string[];
  /** Configuration read from the figure that this step relies on. */
  configuration: string[];
}

export interface VerifyResult {
  ok: boolean;
  steps: StepCheck[];
  /** Problems not tied to one step (e.g. the goal is missing from the proof). */
  issues: string[];
  /** Perturbed figures used for the numeric check. */
  perturbations: number;
}

export interface VerifyOptions {
  /** Extra givens (statement shape words) as produced by the planner, with the method "GIVEN". */
  statementGivens?: Fact[];
  /** Original confirmed text, only for explicit segment-order prerequisites. */
  statementText?: string;
  /** Goals proved in earlier parts (method PREVIOUS_PART). */
  previous?: Fact[];
  /** Highest grade allowed (default 9). */
  maxGrade?: number;
  perturbations?: number;
  seed?: number;
}

const GIVEN_METHODS = new Set(["PREVIOUS_PART", "GIVEN", "CONSTRUCTION", "CIRCLE_RADIUS", "CONCYCLIC_GIVEN", "TANGENT_RADIUS", "THALES_CIRCLE"]);

const sameSeg = (a: Seg, b: Seg) => (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
const sameAngle = (a: Tri, b: Tri) => a[1] === b[1] && ((a[0] === b[0] && a[2] === b[2]) || (a[0] === b[2] && a[2] === b[0]));
const common = (a: Seg, b: Seg) => a.find((x) => b.includes(x));
const other = (s: Seg, x: string) => (s[0] === x ? s[1] : s[0]);

/** A parallel section inside a triangle has a stable point order, proved by the stated segment bounds.
 * The allowance applies only to that five-point configuration, not arbitrary intersections or extra points. */
function boundedParallelSection(figure:Figure,id:string,used:Set<string>,statement?:string):boolean {
 if(!statement)return false;
 const p=figure.points.find(q=>q.id===id);if(p?.kind!=="intersection")return false;
 const [m,helper,a,c]=p.refs;
 const start=figure.points.find(q=>q.id===m),direction=figure.points.find(q=>q.id===helper);
 if(start?.kind!=="on_segment"||direction?.kind!=="translate"||direction.refs[0]!==m||direction.value!==1)return false;
 const b=direction.refs[1];
 if(direction.refs[2]!==c||!a||!b||!c||!m||new Set([a,b,c,m,id]).size!==5||!sameSeg(start.refs as Seg,[a,b]))return false;
 if([...used].some(q=>![a,b,c,m,id].includes(q)))return false;
 const text=statement.split(/chứng minh/iu)[0]!.replace(/\$/g,"").replace(/\s+/g," ");
 const within=(q:string,x:string,y:string)=>new RegExp(`${q} (?:là (?:một )?điểm )?(?:nằm )?(?:trên|thuộc) đoạn(?: thẳng)? (?:${x}${y}|${y}${x})(?:[,. ]|$)`).test(text);
 return within(m,a,b)&&within(id,a,c);
}

/** Altitudes of an acute triangle lie on its sides; the altitude from a right
 * vertex lies on the hypotenuse. These are statement deductions, not coordinates. */
function boundedAltitudeFoot(figure:Figure,id:string,used:Set<string>,statement?:string):boolean {
 if(!statement)return false;
 const p=figure.points.find(q=>q.id===id);if(p?.kind!=="foot")return false;
 const text=statement.split(/chứng minh/iu)[0]!.replace(/\$/g,"").replace(/\s+/g," ");
 for(const match of text.matchAll(/tam giác ([A-Z]{3}) (nhọn|vuông tại ([A-Z]))/gu)) {
  const vertices=[...match[1]!],right=match[3];
  if(new Set(vertices).size!==3||p.refs.length!==3||!p.refs.every(q=>vertices.includes(q))||new Set(p.refs).size!==3)continue;
  if(right&&p.refs[0]!==right)continue;
  const allowed=new Set(vertices);
  for(const foot of figure.points)if(foot.kind==='foot'&&foot.refs.length===3&&new Set(foot.refs).size===3&&foot.refs.every(q=>vertices.includes(q))&&(!right||foot.refs[0]===right))allowed.add(foot.id);
  if([...used].every(q=>allowed.has(q)))return true;
 }
 return false;
}

/** Ninety degrees is unchanged by reversal of either ray. Only use line
 * incidence/direction facts and explicit right angles for this exemption. */
function positionIndependentRightAngles(f:Fact,premises:Fact[],orient:Oracle['orient']):boolean {
 const angles=f.t==='aval'&&f.v===90?[f.a]:f.t==='eqangle'||f.t==='suppl'?[f.a,f.b]:[];
 if(!angles.length)return false;
 const system=new LinearSystem(180);
 for(const p of premises)if(p.t==='col'||p.t==='para'||p.t==='perp'||p.t==='midp'||p.t==='aval'&&p.v===90)for(const eq of angleEquations(p,orient))system.add(eq,0);
 return angles.every(a=>{const eqs=angleEquations({t:'aval',a,v:90},orient);return eqs.length>0&&eqs.every(eq=>system.implies(eq)!==null);});
}

/** Moves the figure's free parameters a little (free points, angles of points on circles, ratios on segments). */
function perturb(figure: Figure, rnd: () => number): Figure {
  const xs = figure.points.filter((p) => p.x !== null).map((p) => p.x!);
  const ys = figure.points.filter((p) => p.y !== null).map((p) => p.y!);
  const scale = Math.max(1, xs.length ? Math.max(...xs) - Math.min(...xs) : 1, ys.length ? Math.max(...ys) - Math.min(...ys) : 1);
  const d = () => (rnd() - 0.5) * 0.04;
  return {
    ...figure,
    points: figure.points.map((p) => {
      if (p.kind === "free" && p.x !== null && p.y !== null) return { ...p, x: p.x + d() * scale, y: p.y + d() * scale };
      if (p.kind === "on_circle" && p.value !== null) return { ...p, value: p.value + d() * 50 };
      if (p.kind === "on_segment" && p.value !== null && p.value > 0 && p.value < 1) return { ...p, value: Math.min(0.95, Math.max(0.05, p.value + d())) };
      return p;
    }),
  };
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function verifyProof(figure: Figure, proof: Derivation[], goals: Fact[], opts: VerifyOptions = {}): VerifyResult {
  const oracle = new Oracle(resolveFigure(figure).points);
  const maxGrade = opts.maxGrade ?? 9;
  const byId = new Map(proof.map((d) => [d.id, d]));
  const position = new Map(proof.map((d, i) => [d.id, i]));
  const givenKeys = new Map<string, string>();
  for (const g of constructionFacts(figure, oracle)) givenKeys.set(factKey(g.fact), g.method);
  for (const f of opts.statementGivens ?? []) givenKeys.set(factKey(f), "GIVEN");
  for (const f of opts.previous ?? []) givenKeys.set(factKey(f), "PREVIOUS_PART");

  // Perturbed copies for the numeric check: keep only those whose construction still resolves with the same configuration.
  const rnd = mulberry32(opts.seed ?? 7);
  const others: Oracle[] = [];
  for (let i = 0; others.length < (opts.perturbations ?? 4) && i < 24; i++) {
    const r = resolveFigure(perturb(figure, rnd));
    if (r.errors.length || Object.keys(r.points).length !== Object.keys(oracle.P).length) continue;
    const o = new Oracle(r.points);
    // A valid instance of the problem: the statement's own givens ("cân tại A", "vuông tại A") still hold.
    if ((opts.statementGivens ?? []).some((g) => !o.holds(g))) continue;
    const ids = Object.keys(oracle.P);
    // Same configuration: every triple keeps its orientation.
    let same = true;
    for (let a = 0; a < ids.length && same; a++)
      for (let b = a + 1; b < ids.length && same; b++)
        for (let c = b + 1; c < ids.length && same; c++) if (o.orient(ids[a]!, ids[b]!, ids[c]!) !== oracle.orient(ids[a]!, ids[b]!, ids[c]!)) same = false;
    if (same) others.push(o);
  }

  const algebra = (f: Fact, premises: number[], kind: "angle" | "length") => {
    const sys = new LinearSystem(kind === "angle" ? 180 : null);
    for (const id of premises) {
      const p = byId.get(id)!.fact;
      for (const eq of kind === "angle" ? angleEquations(p, oracle.orient) : lengthEquations(p)) sys.add(eq, id);
    }
    const eqs = kind === "angle" ? angleEquations(f, oracle.orient) : lengthEquations(f);
    return eqs.length > 0 && eqs.every((eq) => sys.implies(eq) !== null);
  };

  const steps: StepCheck[] = proof.map((d, i) => {
    const problems: string[] = [];
    const configuration: string[] = [];
    const m = method(d.method);
    if (!m) problems.push(`unknown method ${d.method}`);
    else {
      if (!m.allowed) problems.push(`method ${d.method} is outside the curriculum`);
      if (m.grade > maxGrade) problems.push(`method ${d.method} is grade ${m.grade}`);
      if (!m.produces.includes(d.fact.t)) problems.push(`method ${d.method} does not produce a ${d.fact.t} fact`);
    }
    for (const p of d.premises) {
      const at = position.get(p);
      if (at === undefined) problems.push(`premise #${p} is not in the proof`);
      else if (at >= i) problems.push(`premise #${p} comes after the step (circular)`);
    }
    if (problems.length) return { id: d.id, ok: false, problems, configuration };
    const P = d.premises.map((id) => byId.get(id)!.fact);
    const f = d.fact;
    const need = (ok: boolean, why: string) => {
      if (!ok) problems.push(why);
    };

    if (GIVEN_METHODS.has(d.method)) {
      need(d.premises.length === 0, "a given has no premises");
      need(givenKeys.has(factKey(f)), "not a given of the statement or its construction");
    } else
      switch (d.method) {
        case "SAME_RAY_ANGLE": {
          let valid=false;
          if(f.t==='eqangle'&&f.a[1]===f.b[1])for(const a of [f.a,[f.a[2],f.a[1],f.a[0]]] as Tri[])for(const b of [f.b,[f.b[2],f.b[1],f.b[0]]] as Tri[]) {
            if(a[0]!==b[0]||a[2]===b[2])continue;
            for(const [footId,end] of [[a[2],b[2]],[b[2],a[2]]]) {
              const col=P.some(p=>p.t==='col'&&p.p.slice().sort().join() === [a[1],footId,end].sort().join());
              const perp=(x:Seg,y:Seg)=>P.some(p=>p.t==='perp'&&((sameSeg(p.a,x)&&sameSeg(p.b,y))||(sameSeg(p.b,x)&&sameSeg(p.a,y))));
              for(const source of figure.points.map(p=>p.id))if(![a[1],footId,end].includes(source))valid ||=col&&P.length===3&&perp([source,a[1]],[source,end!])&&perp([source,footId!],[a[1],end!]);
            }
          }
          need(valid,'same-ray equality needs the actual projection foot, its collinearity and the established right angle at the source vertex');
          break;
        }
        case "ANGLE_CHASE":
          need(algebra(f, d.premises, "angle"), "does not follow from the cited facts by angle chasing");
          // An intersection of infinite lines does not specify the order of its points.
          // Undirected angle equations selected on one drawing can change to supplements
          // in another admissible configuration. Until the proof represents and proves
          // those positional cases, a numerical orientation is not a justification.
          if (f.t === "eqangle" || f.t === "aval" || f.t === "suppl") {
            const used = new Set([f, ...P].flatMap(factPoints));
            const unrestricted = figure.points.filter(p=>(p.kind === "intersection" || p.kind === "line_circle" || p.kind === "circle_circle" || p.kind === "foot") && used.has(p.id) && !boundedParallelSection(figure,p.id,used,opts.statementText) && !boundedAltitudeFoot(figure,p.id,used,opts.statementText));
            need(unrestricted.length === 0 || positionIndependentRightAngles(f,P,oracle.orient), `undirected angle chase uses unrestricted line intersections (${unrestricted.map(p=>p.id).join(", ")}); point order needs an explicit proof or exhaustive cases, not the drawing`);
          }
          if (f.t === "eqangle" || f.t === "aval" || f.t === "suppl") configuration.push("vị trí tương đối của các điểm (theo hình)");
          break;
        case "SAME_LINE": {
          need(f.t === "col", "SAME_LINE concludes collinearity");
          if (f.t !== "col") break;
          const ok = [0, 1, 2].some((k) => algebra({ t: "para", a: [f.p[k]!, f.p[(k + 1) % 3]!], b: [f.p[k]!, f.p[(k + 2) % 3]!] }, d.premises, "angle"));
          need(ok, "the two lines through the common point are not shown to have the same direction");
          break;
        }
        case "LENGTH_ALGEBRA":
          need(algebra(f, d.premises, "length"), "does not follow from the cited facts by length algebra");
          break;
        case "MIDPOINT":
          need(P.length === 1 && P[0]!.t === "midp" && f.t === "cong" && sameSeg(f.a, [P[0]!.m, P[0]!.a]) !== sameSeg(f.a, [P[0]!.m, P[0]!.b]) &&
            [f.a, f.b].every((s) => sameSeg(s, [(P[0] as Fact & { t: "midp" }).m, (P[0] as Fact & { t: "midp" }).a]) || sameSeg(s, [(P[0] as Fact & { t: "midp" }).m, (P[0] as Fact & { t: "midp" }).b])), "not the two halves of the midpoint's segment");
          break;
        case "MIDLINE": {
          const u = P[0], v = P[1];
          if (P.length !== 2 || u?.t !== "midp" || v?.t !== "midp" || u.m === v.m) { need(false, "MIDLINE needs two distinct side midpoints"); break; }
          const vertex = [u.a, u.b].find((p) => p === v.a || p === v.b);
          if (!vertex) { need(false, "midpoints must belong to two sides with a common vertex"); break; }
          const b = u.a === vertex ? u.b : u.a, c = v.a === vertex ? v.b : v.a;
          need(b !== c && oracle.orient(vertex, b, c) !== 0, "the triangle must be nondegenerate");
          const expected: Fact = f.t === "para"
            ? { t: "para", a: [u.m, v.m], b: [b, c] }
            : { t: "prod", lhs: [{ seg: [u.m, v.m], power: 1, divide: false }], rhs: [{ seg: [b, c], power: 1, divide: false }, { number: 2, divide: true }] };
          need((f.t === "para" || f.t === "prod") && factKey(f) === factKey(expected), "not the parallel or half-length conclusion of the midpoint theorem");
          break;
        }
        case "ISOSCELES": {
          const c = P[0];
          if (P.length !== 1 || c?.t !== "cong" || f.t !== "eqangle") { need(false, "ISOSCELES needs one equality of two sides"); break; }
          const v = common(c.a, c.b);
          if (!v) { need(false, "the equal sides share no vertex"); break; }
          const [x, y] = [other(c.a, v), other(c.b, v)];
          need(sameAngle(f.a, [v, x, y]) && sameAngle(f.b, [v, y, x]) || sameAngle(f.a, [v, y, x]) && sameAngle(f.b, [v, x, y]), "the conclusion is not the pair of base angles");
          break;
        }
        case "ISOSCELES_CONVERSE": {
          const e = P[0];
          if (P.length !== 1 || e?.t !== "eqangle" || f.t !== "cong") { need(false, "ISOSCELES_CONVERSE needs one equality of base angles"); break; }
          const v = common(f.a, f.b);
          if (!v) { need(false, "the sides share no vertex"); break; }
          const [x, y] = [other(f.a, v), other(f.b, v)];
          need(sameAngle(e.a, [v, x, y]) && sameAngle(e.b, [v, y, x]) || sameAngle(e.a, [v, y, x]) && sameAngle(e.b, [v, x, y]), "the cited angles are not the base angles");
          break;
        }
        case "ALTITUDE_ORTHOCENTER": {
          if (f.t !== "perp" || P.length !== 2 || P.some(p=>p.t !== "perp")) {need(false,"needs exactly two established altitudes");break;}
          const keys=new Set(P.map(factKey));
          const valid=([[f.a,f.b],[f.b,f.a]] as [Seg,Seg][]).some(([height,side])=>
            ([height,[height[1],height[0]]] as Seg[]).some(([c,h])=>keys.has(factKey({t:"perp",a:[side[0],h],b:[side[1],c]})) && keys.has(factKey({t:"perp",a:[side[1],h],b:[side[0],c]}))));
          need(new Set([...f.a,...f.b]).size===4 && valid,"premises are not the other two altitudes of the same triangle through the same point");
          break;
        }
        case "PERPENDICULAR_BISECTOR": {
          const congs = P.filter((x): x is Fact & { t: "cong" } => x.t === "cong");
          const midp = P.find((x): x is Fact & { t: "midp" } => x.t === "midp");
          if (f.t === "col" && congs.length === 2 && midp && P.length === 3) {
            // The perpendicular bisector through two equidistant points passes through the midpoint.
            const ends = (c: Fact & { t: "cong" }) => {
              const v = common(c.a, c.b);
              return v ? { v, seg: [other(c.a, v), other(c.b, v)] as Seg } : null;
            };
            const [e1, e2] = [ends(congs[0]!), ends(congs[1]!)];
            need(!!e1 && !!e2 && e1.v !== e2.v && sameSeg(e1.seg, e2.seg) && sameSeg(e1.seg, [midp.a, midp.b]) && [e1.v, e2.v, midp.m].sort().join() === [...f.p].sort().join(), "not the two equidistant points and the midpoint");
            break;
          }
          if (P.length !== 2 || P.some((x) => x.t !== "cong") || f.t !== "perp") { need(false, "needs two equalities of distances"); break; }
          const ends = (c: Fact & { t: "cong" }) => {
            const v = common(c.a, c.b);
            return v ? { v, seg: [other(c.a, v), other(c.b, v)] as Seg } : null;
          };
          const [e1, e2] = [ends(P[0] as Fact & { t: "cong" }), ends(P[1] as Fact & { t: "cong" })];
          need(!!e1 && !!e2 && sameSeg(e1.seg, e2.seg) && e1.v !== e2.v && ((sameSeg(f.a, [e1.v, e2.v]) && sameSeg(f.b, e1.seg)) || (sameSeg(f.b, [e1.v, e2.v]) && sameSeg(f.a, e1.seg))), "the two points are not both equidistant from the segment's ends, or the conclusion is a different line");
          break;
        }
        case "CONGRUENT_RIGHT": {
          // perp(AE, IE), perp(AF, IF), IE = IF ⊢ AE = AF.
          const perps = P.filter((x): x is Fact & { t: "perp" } => x.t === "perp");
          const leg = P.find((x): x is Fact & { t: "cong" } => x.t === "cong");
          if (perps.length !== 2 || !leg || f.t !== "cong") { need(false, "needs two right angles and one pair of equal legs"); break; }
          const a = common(f.a, f.b);
          const i0 = common(leg.a, leg.b);
          if (!a || !i0) { need(false, "malformed sides"); break; }
          const [e, ff] = [other(f.a, a), other(f.b, a)];
          const rightAt = (x: string) => perps.some((p) => (sameSeg(p.a, [a, x]) && sameSeg(p.b, [i0, x])) || (sameSeg(p.b, [a, x]) && sameSeg(p.a, [i0, x])));
          need(rightAt(e) && rightAt(ff) && [other(leg.a, i0), other(leg.b, i0)].sort().join() === [e, ff].sort().join(), "the right angles / legs don't match the conclusion");
          break;
        }
        case "CYCLIC_QUADRILATERAL": {
          const r = P[0];
          if (P.length !== 1 || (r?.t !== "eqangle" && r?.t !== "suppl") || f.t !== "cyclic") { need(false, "needs one angle relation"); break; }
          const [x, p, y] = r.a;
          const [x2, q, y2] = r.b;
          const chordOk = (x === x2 && y === y2) || (x === y2 && y === x2);
          need(chordOk && [x, y, p, q].sort().join() === [...f.p].sort().join(), "the angles don't look at one side of the quadrilateral");
          if (!chordOk) break;
          for(const e of figure.points)for(const h of figure.points) {
            if(e.id===h.id||e.kind!=='foot'||h.kind!=='foot'||e.refs.length!==3||h.refs.length!==3)continue;
            const [b,a,c]=e.refs;
            if(h.refs[0]!==c||!sameSeg(h.refs.slice(1) as Seg,[a!,b!])||[b,c,e.id,h.id].slice().sort().join()!==f.p.slice().sort().join())continue;
            const text=opts.statementText?.split(/chứng minh|chứng tỏ|prove/iu)[0]!.replace(/\$/g,'').replace(/\s+/g,' ') ?? '';
            const nonRight=[a!+b!+c!,a!+c!+b!,b!+a!+c!,b!+c!+a!,c!+a!+b!,c!+b!+a!].some(tri=>new RegExp(`tam giác ${tri} (?:nhọn|tù|không vuông)(?:[,. ]|$)`,'u').test(text));
            need(nonRight,'two altitude feet can coincide with vertices in a right triangle; four distinct cyclic vertices need an established non-right-triangle condition');
          }
          const same = oracle.orient(x, y, p) === oracle.orient(x, y, q);
          const ancestors:Fact[]=[],seen=new Set<number>();
          const visit=(id:number)=>{if(seen.has(id))return;seen.add(id);const a=byId.get(id)!;ancestors.push(a.fact);a.premises.forEach(visit);};
          d.premises.forEach(visit);
          const right=positionIndependentRightAngles(r,ancestors,oracle.orient);
          const alreadyCyclic=ancestors.some(a=>a.t==='cyclic'&&a.p.slice().sort().join()===f.p.slice().sort().join());
          const text=opts.statementText?.split(/chứng minh|chứng tỏ|prove/iu)[0]!.replace(/\$/g,'').replace(/\s+/g,' ') ?? '';
          const side=r.t==='eqangle'?'cùng':'khác';
          const explicitSide=new RegExp(`(?:${p}\\s*(?:,|và)\\s*${q}|${q}\\s*(?:,|và)\\s*${p})\\s*(?:nằm |ở |thuộc )?${side} phía (?:so với |đối với )?(?:đường thẳng )?(?:${x}${y}|${y}${x})(?:[,. ]|$)`,'u').test(text);
          need(right||alreadyCyclic||explicitSide,'circle converse needs established vertex sides or two established right angles; the drawing does not prove this prerequisite');
          need(right||(r.t === "eqangle" ? same : !same), r.t === "eqangle" ? "equal angles on opposite sides of the chord don't give a cyclic quadrilateral" : "supplementary angles on the same side don't give a cyclic quadrilateral");
          configuration.push(right?'hai góc vuông đã chứng minh; không phụ thuộc phía của các đỉnh':`${p}, ${q} ${same ? "cùng phía" : "khác phía"} đối với ${x}${y}`);
          break;
        }
        case "SIMILAR_AA":
        case "SIMILAR_SAS": {
          if (f.t !== "simtri") { need(false, "concludes similarity"); break; }
          const at = (t: Tri, k: number): Tri => [t[(k + 2) % 3]!, t[k]!, t[(k + 1) % 3]!];
          const angles = P.filter((x): x is Fact & { t: "eqangle" } => x.t === "eqangle");
          const matched = [0, 1, 2].filter((k) => angles.some((e) => (sameAngle(e.a, at(f.a, k)) && sameAngle(e.b, at(f.b, k))) || (sameAngle(e.b, at(f.a, k)) && sameAngle(e.a, at(f.b, k)))));
          need(oracle.orient(...f.a) !== 0 && oracle.orient(...f.b) !== 0, "a triangle is degenerate");
          if (d.method === "SIMILAR_AA") need(matched.length >= 2, "needs two pairs of corresponding equal angles");
          else {
            const k = matched[0];
            const ratio = P.find((x): x is Fact & { t: "prod" } => x.t === "prod");
            if (k === undefined || !ratio) { need(false, "needs an equal included angle and a proportion"); break; }
            const [p, v, q] = at(f.a, k);
            const [p2, v2, q2] = at(f.b, k);
            const want: Fact = { t: "prod", lhs: [seg(v, p), seg(v2, q2)], rhs: [seg(v2, p2), seg(v, q)] };
            need(algebra(want, [d.premises.find((id) => byId.get(id)!.fact.t === "prod")!], "length"), "the proportion is not of the sides around the equal angle");
          }
          break;
        }
        case "CYCLIC_SAME_CIRCLE": {
          const cs = P.filter((x): x is Fact & { t: "cyclic" } => x.t === "cyclic");
          if (cs.length !== 2 || f.t !== "cyclic") { need(false, "needs two concyclic quadruples"); break; }
          const shared = cs[1]!.p.filter((x) => cs[0]!.p.includes(x));
          const all = new Set([...cs[0]!.p, ...cs[1]!.p]);
          need(shared.length >= 3 && f.p.every((x) => all.has(x)), "the two circles don't share three points, or the conclusion uses another point");
          break;
        }
        case "RIGHT_TRIANGLE_RELATIONS": {
          // perp(EX, EY), col(X, H, Y), perp(EH, XY) ⊢ EX² = XH·XY | EY² = YH·YX | EH² = HX·HY.
          const right = P.find((x): x is Fact & { t: "perp" } => x.t === "perp" && !!common(x.a, x.b));
          const col = P.find((x): x is Fact & { t: "col" } => x.t === "col");
          const alt = P.find((x): x is Fact & { t: "perp" } => x.t === "perp" && x !== right);
          if (!right || !col || !alt || f.t !== "prod") { need(false, "needs a right angle, the foot on the hypotenuse and the altitude"); break; }
          const e = common(right.a, right.b)!;
          const [x, y] = [other(right.a, e), other(right.b, e)];
          const h = col.p.find((q) => q !== x && q !== y);
          const altOk = !!h && col.p.includes(x) && col.p.includes(y) && ((sameSeg(alt.a, [e, h]) && [x, y].every((q) => alt.b.includes(q))) || (sameSeg(alt.b, [e, h]) && [x, y].every((q) => alt.a.includes(q))));
          const forms: Fact[] = h
            ? [
                { t: "prod", lhs: [{ seg: [e, x], power: 2, divide: false }], rhs: [seg(x, h), seg(x, y)] },
                { t: "prod", lhs: [{ seg: [e, y], power: 2, divide: false }], rhs: [seg(y, h), seg(y, x)] },
                { t: "prod", lhs: [{ seg: [e, h], power: 2, divide: false }], rhs: [seg(h, x), seg(h, y)] },
              ]
            : [];
          need(altOk && forms.some((g) => factKey(g) === factKey(f)), "not a relation of this right triangle and its altitude");
          break;
        }
        case "POWER_OF_POINT":
        case "POWER_OF_POINT_CONVERSE": {
          const cyc = d.method === "POWER_OF_POINT" ? P.find((x) => x.t === "cyclic") : f;
          const prod = d.method === "POWER_OF_POINT" ? f : P.find((x) => x.t === "prod");
          const cols = P.filter((x): x is Fact & { t: "col" } => x.t === "col");
          if (cyc?.t !== "cyclic" || prod?.t !== "prod" || cols.length !== 2) { need(false, "needs a cyclic quadrilateral (or a product) and two collinearities"); break; }
          const segs = [...prod.lhs, ...prod.rhs].filter((x): x is { seg: Seg; power: 1 | 2; divide: boolean } => "seg" in x);
          const x = segs[0] ? segs.map((s) => s.seg).reduce<string | undefined>((acc, s) => (acc === undefined ? undefined : s.includes(acc) ? acc : undefined), segs[0].seg[0]) ?? segs.map((s) => s.seg).reduce<string | undefined>((acc, s) => (acc === undefined ? undefined : s.includes(acc) ? acc : undefined), segs[0].seg[1]) : undefined;
          if (!x || segs.length !== 4) { need(false, "the product is not of four segments from one point"); break; }
          const l = prod.lhs.map((s) => ("seg" in s ? other(s.seg, x) : "")).sort();
          const r = prod.rhs.map((s) => ("seg" in s ? other(s.seg, x) : "")).sort();
          const colHas = (pts: string[]) => cols.some((c) => [x, ...pts].every((q) => c.p.includes(q)));
          need(colHas(l) && colHas(r) && [...l, ...r].sort().join() === [...cyc.p].sort().join(), "the secants don't match the four concyclic points");
          // Converse: X inside both chords or outside both.
          const inside = (a: string, b: string) => Math.abs(oracle.len(a, x) + oracle.len(x, b) - oracle.len(a, b)) < 1e-6 * oracle.scale;
          if (d.method === "POWER_OF_POINT_CONVERSE") {
            need(inside(l[0]!, l[1]!) === inside(r[0]!, r[1]!), `${x} must be inside both segments or outside both`);
            configuration.push(`${x} ${inside(l[0]!, l[1]!) ? "nằm giữa" : "nằm ngoài"} ${l.join("")} và ${r.join("")}`);
          }
          break;
        }
        default:
          need(false, `the verifier has no rule for ${d.method}`);
      }

    // Numeric sanity: on the figure and on every perturbed copy.
    if (!oracle.holds(f)) problems.push("false on the figure");
    else if (others.some((o) => factPoints(f).every((p) => o.P[p]) && !o.holds(f))) problems.push("true on this drawing only (fails when the free points move)");
    return { id: d.id, ok: problems.length === 0, problems, configuration };
  });

  const issues: string[] = [];
  const keys = new Set(proof.map((d) => factKey(d.fact)));
  for (const g of goals) if (!keys.has(factKey(g))) issues.push(`goal not established: ${factKey(g)}`);
  if (others.length === 0) issues.push("no perturbed figure available for the numeric check");
  return { ok: steps.every((s) => s.ok) && issues.filter((x) => !x.startsWith("no perturbed")).length === 0, steps, issues, perturbations: others.length };
}

const seg = (a: string, b: string) => ({ seg: [a, b] as Seg, power: 1 as const, divide: false });
