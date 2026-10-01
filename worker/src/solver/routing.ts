/**
 * Picks which model writes a lesson, before any AI call.
 *
 * Provider-agnostic: callers pass the cheap / geometry / strong model ids from
 * env. Defaults (wrangler): Gemini gemini-2.5-flash → gemini-2.5-pro on verify
 * failure for both algebra and geometry. OpenAI remains available by setting
 * SOLVER_PROVIDER=openai (mini/gpt-5.4 → gpt-5.5).
 *
 * Geometry historically skipped the weakest OpenAI mini (~90% figure failures);
 * with Gemini, flash is cheap enough that flash-first + pro escalate is the
 * default for geometry too.
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

export type ProblemTier = "simple" | "standard" | "complex";

const PROOF_WORDS = /chứng minh|chứng tỏ|\bprove\b|show that/iu;

/**
 * How much reasoning a problem deserves, from its text alone (no model call):
 * - simple: one question with a formula, no figure, no proof, short (a direct equation, an expression to simplify);
 * - complex: a geometry proof, a multi-part proof, or three or more parts;
 * - standard: everything else (word problems, Vi-ét with parameters, geometry calculations…).
 * Length alone never makes a problem complex.
 */
export function problemTier(problemText: string): ProblemTier {
  const text = problemText.normalize("NFC");
  const parts = new Set([...text.matchAll(/(?:^|[\s.;:])([a-e])\)/gu)].map((m) => m[1])).size;
  const proof = PROOF_WORDS.test(text);
  const geometry = looksLikeGeometry(text);
  if ((geometry && proof) || (proof && parts >= 2) || parts >= 3) return "complex";
  // A word problem (no formula in the text) needs an equation set up first: at least standard.
  const formula = /\$|[=<>≤≥]|\^|\\sqrt|\\frac/u.test(text);
  if (!geometry && !proof && parts <= 1 && formula && text.length <= 220) return "simple";
  return "standard";
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
