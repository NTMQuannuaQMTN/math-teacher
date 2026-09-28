import { toHex } from "../crypto";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";

/**
 * Development-only provider: returns canned transcriptions so the whole
 * flow can be exercised without an AI key. It is refused by the factory
 * unless ENVIRONMENT=development, and results are tagged provider="mock" so
 * the app can label them as demo output — never presented as real OCR.
 *
 * The fixture is chosen from a hash of the image bytes, so the same image
 * always yields the same result. A scenario can be forced with the
 * `X-Mock-Scenario` header (development only) to test failure paths.
 */
export const MOCK_SCENARIOS = [
  "quadratic_vi",
  "system_vi",
  "geometry_vi",
  "word_problem_en",
  "fraction_inequality_vi",
  "low_quality",
  "no_math",
  "unreadable",
  "malformed",
  "timeout",
  "provider_error",
  "slow",
] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

const FIXTURES: Record<string, object> = {
  quadratic_vi: {
    status: "success",
    raw_text: "Bài 1. Giải phương trình: x² + 5x + 6 = 0",
    formatted_text: "Bài 1. Giải phương trình:\n$$x^{2} + 5x + 6 = 0$$",
    language: "vi",
    confidence: "high",
    issues: [],
  },
  system_vi: {
    status: "success",
    raw_text: "Câu 2. Giải hệ phương trình:\n{ 2x + y = 5\n{ x − 3y = −1",
    formatted_text:
      "Câu 2. Giải hệ phương trình:\n$$\\begin{cases} 2x + y = 5 \\\\ x - 3y = -1 \\end{cases}$$",
    language: "vi",
    confidence: "high",
    issues: [],
  },
  geometry_vi: {
    status: "success",
    raw_text:
      "Bài 4. Cho △ABC vuông tại A, đường cao AH. Biết AB = 6 cm, AC = 8 cm.\na) Tính BC và AH.\nb) Chứng minh AB² = BH · BC.",
    formatted_text:
      "Bài 4. Cho $\\triangle ABC$ vuông tại $A$, đường cao $AH$. Biết $AB = 6$ cm, $AC = 8$ cm.\na) Tính $BC$ và $AH$.\nb) Chứng minh $AB^{2} = BH \\cdot BC$.",
    language: "vi",
    confidence: "medium",
    issues: [],
  },
  word_problem_en: {
    status: "success",
    raw_text:
      "A rectangle has a perimeter of 28 cm. Its length is 4 cm more than its width. Find the area of the rectangle.",
    formatted_text:
      "A rectangle has a perimeter of $28$ cm. Its length is $4$ cm more than its width. Find the area of the rectangle.",
    language: "en",
    confidence: "high",
    issues: [],
  },
  fraction_inequality_vi: {
    status: "success",
    raw_text: "Bài 3. Rút gọn biểu thức A = (√x + 1)/(√x − 1) − 2/(x − 1) với x ≥ 0, x ≠ 1.",
    formatted_text:
      "Bài 3. Rút gọn biểu thức\n$$A = \\frac{\\sqrt{x} + 1}{\\sqrt{x} - 1} - \\frac{2}{x - 1}$$\nvới $x \\ge 0,\\ x \\ne 1$.",
    language: "vi",
    confidence: "high",
    issues: [],
  },
  low_quality: {
    status: "success",
    raw_text: "Tìm x biết: 3x − 7 = 2(x + 1)",
    formatted_text: "Tìm $x$ biết: $3x - 7 = 2(x + 1)$",
    language: "vi",
    confidence: "low",
    issues: ["blurry", "handwriting_uncertain"],
  },
  no_math: {
    status: "no_math_found",
    raw_text: "",
    formatted_text: "",
    language: "unknown",
    confidence: "high",
    issues: [],
  },
  unreadable: {
    status: "unreadable",
    raw_text: "",
    formatted_text: "",
    language: "unknown",
    confidence: "low",
    issues: ["blurry"],
  },
};

const ROTATION: MockScenario[] = [
  "quadratic_vi",
  "system_vi",
  "geometry_vi",
  "word_problem_en",
  "fraction_inequality_vi",
];

export class MockOcrProvider implements OcrProvider {
  readonly name = "mock";

  constructor(private readonly forcedScenario: MockScenario | null) {}

  async extract({ bytes, signal }: OcrInput): Promise<ProviderOutput> {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const scenario = this.forcedScenario ?? ROTATION[digest[0]! % ROTATION.length]!;
    await delay(scenario === "slow" ? 8000 : 900, signal);

    switch (scenario) {
      case "timeout":
        await delay(120_000, signal);
        throw new OcrFailure("timeout", "mock timeout", true);
      case "provider_error":
        throw new OcrFailure("provider_error", "mock provider error", true);
      case "malformed":
        return { text: "Sure! Here is the problem: x^2 + 5x + 6 = 0", model: `mock-${toHex(digest).slice(0, 6)}` };
      case "slow":
        return { text: JSON.stringify(FIXTURES.quadratic_vi), model: "mock-fixture" };
      default:
        return { text: JSON.stringify(FIXTURES[scenario]), model: "mock-fixture" };
    }
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
