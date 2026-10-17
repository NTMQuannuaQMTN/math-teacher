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

export interface HostedSettings {
  simpleEffort?: string;
  effort?: string;
  complexMaxTokens?: number;
  complexRequestTimeoutMs?: number;
}

/**
 * Per-problem settings for a hosted reasoning model (one place, used by the solve route and the benchmark):
 * hidden reasoning is most of the latency, so a simple problem gets less of it; hard multi-part chuyên problems
 * (proofs + figure) can reason past 12K tokens, so the complex tier gets a bigger budget and the time to use it.
 */
export function hostedModelOptions(problemText: string, s: HostedSettings = {}) {
  const tier = problemTier(problemText);
  const reasoningEffort = (tier === "simple" ? s.simpleEffort || "minimal" : s.effort || "low") as "none" | "minimal" | "low" | "medium" | "high";
  return {
    reasoningEffort,
    ...(tier === "complex" ? { maxTokens: s.complexMaxTokens ?? 24_000, requestTimeoutMs: s.complexRequestTimeoutMs ?? 240_000 } : {}),
  };
}

/**
 * SOCLAAS (qwen3.6:35b, ~120–330 tokens/s): more room than the free model's defaults — 12K truncated ordinary geometry
 * lessons (GEO-R1b: g3, g5, g6, g9), and a truncated request is paid for and wasted.
 * The gateway now ends every request at 120 s with HTTP 502 "provider request failed" (measured 2026-10-14: 120.1 s,
 * unbilled), so requests stop at 115 s, and a geometry lesson (proof + figure, the longest output) is written without
 * hidden thinking so that it fits; the deterministic planner's verified facts and the claim checker carry its proof.
 */
export const SOCLAAS_REQUEST_LIMIT_MS = 115_000;
const NEEDS_REASONING = /lớn nhất|nhỏ nhất|giá trị (?:lớn|nhỏ)|chứng minh|chứng tỏ|bất đẳng thức|tìm tất cả|\b(?:prove|show that|maximum|minimum|inequality)\b/iu;

export function soclaasModelOptions(problemText: string) {
  const tier = problemTier(problemText);
  // Thinking only where it pays off. Off for plain computations (g1–g6: same verified answers at ~¼ of the tokens);
  // on for hard problems and for anything that needs an argument — an extremum, a proof, an inequality (ch-2 "find the
  // largest perimeter" answered 16 instead of 18 without it). Thinking needs room: ch-2 with it truncated at 24K.
  const thinking = (tier === "complex" || NEEDS_REASONING.test(problemText.normalize("NFC"))) && !looksLikeGeometry(problemText);
  return {
    ...hostedModelOptions(problemText),
    maxTokens: thinking ? 24_000 : tier === "standard" ? 20_000 : 16_000,
    requestTimeoutMs: SOCLAAS_REQUEST_LIMIT_MS,
    gatewayThinking: thinking,
  };
}

/**
 * A problem that needs an argument (proof, extremum, "find all", or a complex problem). For SOCLAAS geometry the thinking
 * goes into a separate outline request (short output, fits the 120 s gateway limit) and the lesson is written from it.
 */
export function soclaasNeedsThinking(problemText: string): boolean {
  return problemTier(problemText) === "complex" || NEEDS_REASONING.test(problemText.normalize("NFC"));
}

/** Outline request for the two-stage solve: hidden thinking, short answer, within the gateway limit. */
export function soclaasOutlineOptions(problemText: string) {
  return { ...hostedModelOptions(problemText), maxTokens: 12_000, requestTimeoutMs: SOCLAAS_REQUEST_LIMIT_MS, gatewayThinking: true };
}

/** The same model without hidden thinking: the retry after a thinking request was cut off at the gateway limit. */
export function soclaasDirectOptions(problemText: string) {
  return { ...soclaasModelOptions(problemText), gatewayThinking: false, maxTokens: 20_000 };
}
