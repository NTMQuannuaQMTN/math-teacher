/**
 * Picks which model writes a lesson, before any AI call.
 *
 * Algebra / word problems: gpt-5.4-mini (low) first; escalate to gpt-5.5 only
 * when the deterministic checks fail (~$0.005 when the cheap model succeeds).
 *
 * Geometry: gpt-5.4-mini figures fail construction checks ~90% of the time
 * (measured 2026-09-29), so a mini-first geometry route would usually pay for
 * *both* models. Instead geometry starts on a mid-tier model (default gpt-5.4,
 * ~half the price of gpt-5.5) and escalates to the strong fallback only on
 * verify failure. That also avoids the old "strong-only" path, which retried
 * the same expensive model twice with no cheaper first attempt.
 */
const GEOMETRY_WORDS = [
  // Vietnamese
  "tam giác", "tứ giác", "hình thang", "hình bình hành", "hình chữ nhật", "hình vuông", "hình thoi",
  "đường tròn", "đường thẳng", "đoạn thẳng", "tia ", "góc", "tiếp tuyến", "dây cung", "bán kính", "đường kính",
  "vuông góc", "song song", "trung điểm", "đường cao", "trung tuyến", "phân giác", "trung trực", "hình chiếu",
  "nội tiếp", "ngoại tiếp", "cân tại", "vuông tại",
  // English
  "triangle", "quadrilateral", "parallelogram", "rectangle", "rhombus", "trapezoid", "circle", "chord", "tangent",
  "radius", "diameter", "angle", "perpendicular", "parallel", "midpoint", "altitude", "median", "bisector",
];

const GEOMETRY_SYMBOLS = /[△∠⊥∥]|\\(?:triangle|widehat|angle|perp|parallel|hat\{)/;

export function looksLikeGeometry(problemText: string): boolean {
  const text = problemText.normalize("NFC").toLowerCase();
  return GEOMETRY_SYMBOLS.test(problemText) || GEOMETRY_WORDS.some((w) => text.includes(w));
}

export interface SolverModelChoice {
  /** Model id for the first attempt. */
  primary: string;
  primaryEffort: string;
  /** Stronger model for the single corrective retry; omitted when none is configured. */
  fallback?: string;
  fallbackEffort?: string;
}

/**
 * Pure routing: which model ids (and reasoning effort) to use for this problem.
 * Callers build the JsonModel clients; this stays free of I/O so it is easy to test.
 */
export function selectSolverModelIds(
  problemText: string,
  opts: {
    cheap: string;
    cheapEffort: string;
    strong?: string;
    strongEffort?: string;
    /** Mid-tier geometry primary; default gpt-5.4. */
    geometry?: string;
    geometryEffort?: string;
  },
): SolverModelChoice {
  const cheap = opts.cheap.trim() || "gpt-5.4-mini";
  const cheapEffort = opts.cheapEffort.trim() || "low";
  const strong = opts.strong?.trim() || undefined;
  const strongEffort = (opts.strongEffort ?? "medium").trim() || "medium";
  const geometry = (opts.geometry ?? "gpt-5.4").trim() || "gpt-5.4";
  const geometryEffort = (opts.geometryEffort ?? "medium").trim() || "medium";

  if (strong && looksLikeGeometry(problemText)) {
    // Mid-tier first; escalate to strong only when checks fail.
    if (geometry === strong) {
      return { primary: strong, primaryEffort: strongEffort };
    }
    return {
      primary: geometry,
      primaryEffort: geometryEffort,
      fallback: strong,
      fallbackEffort: strongEffort,
    };
  }

  if (strong && strong !== cheap) {
    return {
      primary: cheap,
      primaryEffort: cheapEffort,
      fallback: strong,
      fallbackEffort: strongEffort,
    };
  }

  return { primary: cheap, primaryEffort: cheapEffort };
}
