/**
 * Linear equations over named variables with provenance — the algebra behind angle chasing and length ratios.
 *
 * Angles: one variable per line (its direction θ, mod 180°). A directed angle between two lines is a difference of
 * directions, so "∠ABC = ∠DEF", "AB ∥ CD", "AB ⊥ CD", "∠ABC = 40°", inscribed angles in a circle and the angles of an
 * isosceles triangle are all linear equations; the angle sum of a triangle holds automatically.
 * Lengths: one variable per segment (log of its length), so equal segments, ratios and products are linear too.
 *
 * Every equation carries the set of facts it came from; a query that succeeds returns the facts it used, so a derived
 * conclusion can cite exactly its premises. Rows are kept in reduced row-echelon form. Modulo 180° every operation is
 * an integer combination (pivots are ±1), because dividing a congruence is not valid.
 */
export type Coef = Map<string, number>;

export interface Equation {
  coef: Coef;
  /** Right-hand side: Σ coef·var = c. */
  c: number;
}

interface Row extends Equation {
  pivot: string;
  prov: Set<number>;
}

const EPS = 1e-9;

export class LinearSystem {
  private rows: Row[] = [];
  /** 180 for angles (directions of lines are defined mod 180°), null for log-lengths. */
  constructor(private readonly modulus: number | null) {}

  private reduce(eq: Equation, prov: Set<number>): { coef: Coef; c: number; prov: Set<number> } {
    const coef = new Map(eq.coef);
    let c = eq.c;
    const used = new Set(prov);
    for (const row of this.rows) {
      const k = coef.get(row.pivot);
      if (!k || Math.abs(k) < EPS) continue;
      for (const [v, a] of row.coef) {
        const next = (coef.get(v) ?? 0) - k * a;
        if (Math.abs(next) < EPS) coef.delete(v);
        else coef.set(v, next);
      }
      c -= k * row.c;
      for (const p of row.prov) used.add(p);
    }
    return { coef, c, prov: used };
  }

  private zeroConst(c: number): boolean {
    if (this.modulus === null) return Math.abs(c) < 1e-7;
    const r = ((c % this.modulus) + this.modulus) % this.modulus;
    return r < 1e-6 || this.modulus - r < 1e-6;
  }

  /** Equations (mod 180°) with no ±1 coefficient yet: retried after each new row, which may reduce them. */
  private pending: { eq: Equation; prov: Set<number> }[] = [];

  /** Adds an equation (from fact `id`). Returns false when it was already implied (or is kept pending). */
  add(eq: Equation, id: number): boolean {
    const added = this.addWith(eq, new Set([id]));
    if (added && this.pending.length) {
      // A new pivot may give a pending equation a ±1 coefficient.
      for (let again = true; again; ) {
        again = false;
        const waiting = this.pending;
        this.pending = [];
        for (const p of waiting) if (this.addWith(p.eq, p.prov)) again = true;
      }
    }
    return added;
  }

  private addWith(eq: Equation, provIn: Set<number>): boolean {
    const { coef, c, prov } = this.reduce(eq, provIn);
    if (coef.size === 0) return false;
    let pivot = "";
    if (this.modulus === null) {
      let best = 0;
      for (const [v, a] of coef) if (Math.abs(a) > best + EPS || (Math.abs(Math.abs(a) - best) < EPS && v < pivot)) [pivot, best] = [v, Math.abs(a)];
    } else {
      // Modulo 180°, only integer combinations are sound (2x ≡ 0 allows x = 90°): pivot on a ±1 coefficient so every
      // row stays integer. An equation with none (all |coefficients| ≥ 2 after reduction) is not used.
      for (const [v, a] of coef) if (Math.abs(Math.abs(a) - 1) < EPS && (!pivot || v < pivot)) pivot = v;
      if (!pivot) {
        this.pending.push({ eq: { coef, c }, prov });
        return false;
      }
    }
    const k = coef.get(pivot)!;
    const row: Row = { coef: new Map([...coef].map(([v, a]) => [v, a / k])), c: c / k, pivot, prov };
    // Keep the system reduced: eliminate the new pivot from the existing rows.
    for (const r of this.rows) {
      const f = r.coef.get(pivot);
      if (!f) continue;
      for (const [v, a] of row.coef) {
        const next = (r.coef.get(v) ?? 0) - f * a;
        if (Math.abs(next) < EPS) r.coef.delete(v);
        else r.coef.set(v, next);
      }
      r.c -= f * row.c;
      for (const p of row.prov) r.prov.add(p);
    }
    this.rows.push(row);
    return true;
  }

  /** The facts that imply `eq`, or null when it doesn't follow. */
  implies(eq: Equation): Set<number> | null {
    const { coef, c, prov } = this.reduce(eq, new Set());
    if (coef.size > 0 || !this.zeroConst(c)) return null;
    return prov;
  }

  get size(): number {
    return this.rows.length;
  }
}

/** Builds an equation from (variable, coefficient) pairs, merging repeats. */
export function equation(terms: [string, number][], c = 0): Equation {
  const coef: Coef = new Map();
  for (const [v, a] of terms) {
    const next = (coef.get(v) ?? 0) + a;
    if (Math.abs(next) < EPS) coef.delete(v);
    else coef.set(v, next);
  }
  return { coef, c };
}
