import type { Domain } from "./knowledgeBase";

export interface SpecialistProfile {
  id: `${Domain}-bot`;
  name: string;
  responsibility: string;
  rules: string[];
}

/** Domain-specific policy layered over the shared OCR, schema, rendering, and verifier pipeline. */
export const SPECIALIST_PROFILES: Record<Domain, SpecialistProfile> = {
  algebra: {
    id: "algebra-bot",
    name: "Algebra Bot",
    responsibility: "algebraic identities, equations, inequalities, radicals, Viète, and optimization",
    rules: ["track domains before cancelling or squaring", "substitute candidate roots into the original condition", "prove completeness rather than listing discovered roots"],
  },
  geometry: {
    id: "geometry-bot",
    name: "Geometry Bot",
    responsibility: "Euclidean configurations, lengths, angles, ratios, circles, and complete proofs",
    rules: ["separate givens from derived claims", "never use a diagram as proof", "state theorem preconditions and expose every auxiliary construction"],
  },
  number_theory: {
    id: "number_theory-bot",
    name: "Number Theory Bot",
    responsibility: "divisibility, congruences, integer equations, bounds, and perfect powers",
    rules: ["state the integer domain", "distinguish implication from equivalence modulo a composite", "justify finite bounds before enumeration and prove completeness"],
  },
  combinatorics: {
    id: "combinatorics-bot",
    name: "Combinatorics Bot",
    responsibility: "counting, cases, inclusion-exclusion, pigeonhole, invariants, and elementary probability",
    rules: ["define the objects and whether order/repetition matters", "make cases disjoint and exhaustive or correct overlaps", "compare small instances with independent enumeration when feasible"],
  },
};

export function specialistInstructions(domains: Domain[]): string {
  return domains
    .map((domain) => {
      const p = SPECIALIST_PROFILES[domain];
      return `${p.name} (${p.id}) is responsible for ${p.responsibility}. Mandatory checks: ${p.rules.join("; ")}.`;
    })
    .join("\n");
}
